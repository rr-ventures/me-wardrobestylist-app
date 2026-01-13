import { z } from 'zod';
import { GeminiResponse, GeminiOutfit, GeminiOutfitItem } from '../types/gemini.types';

const geminiOutfitItemSchema = z.object({
  top: z.string().nullable().optional(),
  bottom: z.string().nullable().optional(),
  dress: z.string().nullable().optional(),
  outerwear: z.string().nullable().optional(),
  shoes: z.string(),
  accessories: z.array(z.string()).optional(),
});

const geminiOutfitVariantSchema = z.object({
  swap_out: z.string(),
  swap_in: z.string(),
  reason: z.string(),
});

const geminiOutfitSchema = z.object({
  name: z.string(),
  items: geminiOutfitItemSchema,
  why_it_works: z.string(),
  variants: z.array(geminiOutfitVariantSchema).optional(),
});

const geminiResponseSchema = z.object({
  outfits: z.array(geminiOutfitSchema),
});

export function validateGeminiResponse(data: unknown): GeminiResponse {
  try {
    return geminiResponseSchema.parse(data) as GeminiResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid Gemini response: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function validateOutfitItemIds(
  outfit: GeminiOutfit,
  validItemIds: Set<string>
): void {
  const itemIds: string[] = [];
  
  if (outfit.items.top) itemIds.push(outfit.items.top);
  if (outfit.items.bottom) itemIds.push(outfit.items.bottom);
  if (outfit.items.dress) itemIds.push(outfit.items.dress);
  if (outfit.items.outerwear) itemIds.push(outfit.items.outerwear);
  if (outfit.items.shoes) itemIds.push(outfit.items.shoes);
  if (outfit.items.accessories) itemIds.push(...outfit.items.accessories);

  const invalidIds = itemIds.filter(id => !validItemIds.has(id));
  if (invalidIds.length > 0) {
    throw new Error(`Invalid item IDs in outfit "${outfit.name}": ${invalidIds.join(', ')}`);
  }
}
