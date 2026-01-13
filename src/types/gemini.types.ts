export interface GeminiOutfitItem {
  top?: string | null;
  bottom?: string | null;
  dress?: string | null;
  outerwear?: string | null;
  shoes: string;
  accessories?: string[];
}

export interface GeminiOutfitVariant {
  swap_out: string;
  swap_in: string;
  reason: string;
}

export interface GeminiOutfit {
  name: string;
  items: GeminiOutfitItem;
  why_it_works: string;
  variants?: GeminiOutfitVariant[];
}

export interface GeminiResponse {
  outfits: GeminiOutfit[];
}

export interface GeminiPromptContext {
  wardrobeItems: Array<{
    id: string;
    name: string;
    category: string;
    colors: string[];
    pattern: string;
    material?: string;
    season: string[];
    formality: string;
    fitNotes?: string;
  }>;
  styleInspo: Array<{
    name: string;
    vibeTags: string[];
    why?: string;
  }>;
  recentFeedback: Array<{
    rating: string;
    whatWorked?: string;
    whatDidnt?: string;
    notes?: string;
  }>;
  requestContext: string;
  constraints?: string;
  numberOfOptions: number;
}
