import { WardrobeItem } from './notion.types';
import { GeminiOutfit } from './gemini.types';

export interface OutfitGenerationInput {
  requestId: string;
  context: string;
  constraints?: string;
  numberOfOptions: number;
}

export interface OutfitGenerationResult {
  success: boolean;
  outfits?: GeminiOutfit[];
  error?: string;
}

export interface OutfitItemMapping {
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  dress?: WardrobeItem;
  outerwear?: WardrobeItem;
  shoes: WardrobeItem;
  accessories: WardrobeItem[];
}

export interface ValidatedOutfit {
  name: string;
  items: OutfitItemMapping;
  whyItWorks: string;
  variants?: Array<{
    swapOut: string;
    swapIn: string;
    reason: string;
  }>;
}
