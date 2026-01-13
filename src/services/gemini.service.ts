import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiPromptContext, GeminiResponse } from '../types/gemini.types';
import { validateGeminiResponse } from '../utils/validator';
import { retryWithBackoff } from '../utils/retry';
import { getLogger } from '../utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelFlash: any;
  private modelPro: any;
  private logger = getLogger();

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using latest Gemini models with NanoBanana Pro (image processing capabilities)
    // Primary: Gemini 2.0 Flash Experimental (supports vision/image processing)
    // Fallback: Gemini 1.5 Pro (stable with vision capabilities)
    this.modelFlash = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.modelPro = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Fallback model
  }

  async generateOutfits(context: GeminiPromptContext): Promise<GeminiResponse> {
    const prompt = this.buildPrompt(context);
    
    try {
      return await this.callGeminiWithRetry(prompt, true);
    } catch (error) {
      this.logger.warn('Flash model failed, retrying with Pro model', { error });
      // Fallback to Pro model
      return await this.callGeminiWithRetry(prompt, false);
    }
  }

  private async callGeminiWithRetry(
    prompt: string,
    useFlash: boolean
  ): Promise<GeminiResponse> {
    const model = useFlash ? this.modelFlash : this.modelPro;
    
    return await retryWithBackoff(
      async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonText = text.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```')) {
          const lines = jsonText.split('\n');
          lines.shift(); // Remove first line (```json or ```)
          lines.pop(); // Remove last line (```)
          jsonText = lines.join('\n');
        }
        
        // Parse and validate JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonText);
        } catch (parseError) {
          this.logger.error('Failed to parse Gemini JSON response', { text, parseError });
          throw new Error(`Invalid JSON response from Gemini: ${parseError}`);
        }
        
        return validateGeminiResponse(parsed);
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
      }
    );
  }

  private buildPrompt(context: GeminiPromptContext): string {
    const wardrobeList = context.wardrobeItems
      .map(
        item => `- ${item.name} (ID: ${item.id})
  Category: ${item.category}
  Colors: ${item.colors.join(', ')}
  Pattern: ${item.pattern}
  ${item.material ? `Material: ${item.material}` : ''}
  Season: ${item.season.join(', ')}
  Formality: ${item.formality}
  ${item.fitNotes ? `Fit Notes: ${item.fitNotes}` : ''}`
      )
      .join('\n\n');

    const inspoList = context.styleInspo
      .map(
        inspo => `- ${inspo.name}
  Vibe Tags: ${inspo.vibeTags.join(', ')}
  ${inspo.why ? `Why: ${inspo.why}` : ''}`
      )
      .join('\n\n');

    const feedbackList =
      context.recentFeedback.length > 0
        ? context.recentFeedback
            .map(
              fb => `- Rating: ${fb.rating}/5
  ${fb.whatWorked ? `What Worked: ${fb.whatWorked}` : ''}
  ${fb.whatDidnt ? `What Didn't: ${fb.whatDidnt}` : ''}
  ${fb.notes ? `Notes: ${fb.notes}` : ''}`
            )
            .join('\n\n')
        : 'No recent feedback available.';

    return `You are a personal stylist assistant helping create outfit combinations from a wardrobe.

WARDROBE ITEMS (use ONLY these items - IDs must match exactly):
${wardrobeList}

STYLE INSPIRATION:
${inspoList}

RECENT FEEDBACK (learn from this):
${feedbackList}

REQUEST CONTEXT:
${context.requestContext}

${context.constraints ? `CONSTRAINTS (must follow these):\n${context.constraints}` : ''}

TASK:
Generate exactly ${context.numberOfOptions} outfit combinations using ONLY the wardrobe items listed above. Each outfit must:
1. Include required components: either (top + bottom) OR dress, plus shoes
2. Optionally include outerwear if weather/context suggests it
3. Optionally include accessories (bag, jewelry, etc.)
4. Use item IDs exactly as shown in the wardrobe list
5. Respect all constraints and context provided
6. Consider recent feedback to improve suggestions

OUTPUT FORMAT:
You MUST respond with ONLY valid JSON (no markdown, no explanation, no code blocks). The JSON must match this exact schema:

{
  "outfits": [
    {
      "name": "Outfit name (e.g., 'Casual Summer Brunch')",
      "items": {
        "top": "item-id-here or null",
        "bottom": "item-id-here or null",
        "dress": "item-id-here or null",
        "outerwear": "item-id-here or null",
        "shoes": "item-id-here",
        "accessories": ["item-id-1", "item-id-2"]
      },
      "why_it_works": "Brief explanation of color harmony, silhouette, formality match, etc.",
      "variants": [
        {
          "swap_out": "item-id",
          "swap_in": "item-id",
          "reason": "Why this swap works"
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks
- All item IDs must exist in the wardrobe list above
- Each outfit must have either (top+bottom) OR dress, never both
- Shoes are required for every outfit
- Be creative but practical - consider the context and constraints`;
  }
}
