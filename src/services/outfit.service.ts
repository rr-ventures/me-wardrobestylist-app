import { NotionService } from './notion.service';
import { GeminiService } from './gemini.service';
import {
  OutfitGenerationInput,
  OutfitGenerationResult,
  ValidatedOutfit,
} from '../types/outfit.types';
import { GeminiPromptContext, GeminiOutfit } from '../types/gemini.types';
import { WardrobeItem } from '../types/notion.types';
import { validateOutfitItemIds } from '../utils/validator';
import { getLogger } from '../utils/logger';

export class OutfitService {
  private notionService: NotionService;
  private geminiService: GeminiService;
  private logger = getLogger();

  constructor(notionService: NotionService, geminiService: GeminiService) {
    this.notionService = notionService;
    this.geminiService = geminiService;
  }

  async generateOutfits(input: OutfitGenerationInput): Promise<OutfitGenerationResult> {
    try {
      this.logger.info('Starting outfit generation', { requestId: input.requestId });

      // Fetch all required data from Notion
      const [wardrobeItems, styleInspo, recentFeedback] = await Promise.all([
        this.notionService.getActiveWardrobeItems(),
        this.notionService.getLikedStyleInspo(),
        this.notionService.getRecentWornFeedback(30),
      ]);

      if (wardrobeItems.length === 0) {
        throw new Error('No active wardrobe items found');
      }

      this.logger.info('Fetched data from Notion', {
        wardrobeCount: wardrobeItems.length,
        inspoCount: styleInspo.length,
        feedbackCount: recentFeedback.length,
      });

      // Build Gemini prompt context
      const promptContext: GeminiPromptContext = {
        wardrobeItems: wardrobeItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          colors: item.colors,
          pattern: item.pattern,
          material: item.material,
          season: item.season,
          formality: item.formality,
          fitNotes: item.fitNotes,
        })),
        styleInspo: styleInspo.map(inspo => ({
          name: inspo.name,
          vibeTags: inspo.vibeTags,
          why: inspo.why,
        })),
        recentFeedback: recentFeedback.map(fb => ({
          rating: fb.rating,
          whatWorked: fb.whatWorked,
          whatDidnt: fb.whatDidnt,
          notes: fb.notes,
        })),
        requestContext: input.context,
        constraints: input.constraints,
        numberOfOptions: input.numberOfOptions,
      };

      // Call Gemini to generate outfits
      const geminiResponse = await this.geminiService.generateOutfits(promptContext);

      // Validate and map outfits
      const validItemIds = new Set(wardrobeItems.map(item => item.id));
      const validatedOutfits = this.validateAndMapOutfits(
        geminiResponse.outfits,
        wardrobeItems,
        validItemIds
      );

      // Create outfit pages in Notion
      const createdOutfitIds: string[] = [];
      for (const outfit of validatedOutfits) {
        try {
          const outfitId = await this.createOutfitInNotion(input.requestId, outfit);
          createdOutfitIds.push(outfitId);
          this.logger.info('Created outfit in Notion', { outfitId, name: outfit.name });
        } catch (error) {
          this.logger.error('Failed to create outfit in Notion', error, {
            outfitName: outfit.name,
          });
          // Continue with other outfits even if one fails
        }
      }

      if (createdOutfitIds.length === 0) {
        throw new Error('Failed to create any outfits in Notion');
      }

      this.logger.info('Outfit generation completed', {
        requestId: input.requestId,
        outfitsCreated: createdOutfitIds.length,
      });

      return {
        success: true,
        outfits: geminiResponse.outfits,
      };
    } catch (error) {
      this.logger.error('Outfit generation failed', error, { requestId: input.requestId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateAndMapOutfits(
    outfits: GeminiOutfit[],
    wardrobeItems: WardrobeItem[],
    validItemIds: Set<string>
  ): ValidatedOutfit[] {
    const itemMap = new Map<string, WardrobeItem>();
    wardrobeItems.forEach(item => itemMap.set(item.id, item));

    const validated: ValidatedOutfit[] = [];

    for (const outfit of outfits) {
      try {
        // Validate item IDs exist
        validateOutfitItemIds(outfit, validItemIds);

        // Map items to WardrobeItem objects
        const items: ValidatedOutfit['items'] = {
          shoes: itemMap.get(outfit.items.shoes)!,
          accessories: [],
        };

        if (outfit.items.top) {
          items.top = itemMap.get(outfit.items.top);
        }
        if (outfit.items.bottom) {
          items.bottom = itemMap.get(outfit.items.bottom);
        }
        if (outfit.items.dress) {
          items.dress = itemMap.get(outfit.items.dress);
        }
        if (outfit.items.outerwear) {
          items.outerwear = itemMap.get(outfit.items.outerwear);
        }
        if (outfit.items.accessories) {
          items.accessories = outfit.items.accessories
            .map(id => itemMap.get(id))
            .filter((item): item is WardrobeItem => item !== undefined);
        }

        validated.push({
          name: outfit.name,
          items,
          whyItWorks: outfit.why_it_works,
          variants: outfit.variants?.map(v => ({
            swapOut: v.swap_out,
            swapIn: v.swap_in,
            reason: v.reason,
          })),
        });
      } catch (error) {
        this.logger.warn('Skipping invalid outfit', { error, outfitName: outfit.name });
        // Skip invalid outfits but continue processing
      }
    }

    return validated;
  }

  private async createOutfitInNotion(
    requestId: string,
    outfit: ValidatedOutfit
  ): Promise<string> {
    const itemsJson = JSON.stringify({
      top: outfit.items.top?.id || null,
      bottom: outfit.items.bottom?.id || null,
      dress: outfit.items.dress?.id || null,
      outerwear: outfit.items.outerwear?.id || null,
      shoes: outfit.items.shoes.id,
      accessories: outfit.items.accessories.map(a => a.id),
    });

    return await this.notionService.createOutfit({
      name: outfit.name,
      requestId,
      itemsJson,
      topId: outfit.items.top?.id,
      bottomId: outfit.items.bottom?.id,
      dressId: outfit.items.dress?.id,
      outerwearId: outfit.items.outerwear?.id,
      shoesId: outfit.items.shoes.id,
      accessoryIds: outfit.items.accessories.map(a => a.id),
      rationale: outfit.whyItWorks,
    });
  }
}
