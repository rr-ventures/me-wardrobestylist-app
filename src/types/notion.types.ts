import { PageObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export interface WardrobeItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'outerwear' | 'dress' | 'shoes' | 'bag' | 'accessory';
  colors: string[];
  pattern: 'solid' | 'striped' | 'checked' | 'floral' | 'graphic' | 'other';
  material?: string;
  season: string[];
  formality: '1-casual' | '2-smart-casual' | '3-business-casual' | '4-business' | '5-formal';
  fitNotes?: string;
  purchaseLink?: string;
  status: 'active' | 'archived';
  imageUrls: string[];
}

export interface StyleInspo {
  id: string;
  name: string;
  imageUrls: string[];
  vibeTags: string[];
  like: boolean;
  why?: string;
  sourceUrl?: string;
}

export interface OutfitRequest {
  id: string;
  requestDate: string | null;
  context: string;
  constraints?: string;
  numberOfOptions: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  generatedOutfits: string[]; // Array of outfit IDs
}

export interface MyOutfit {
  id: string;
  name: string;
  created: string;
  requestId: string;
  itemsJson: string;
  topId?: string;
  bottomId?: string;
  dressId?: string;
  outerwearId?: string;
  shoesId?: string;
  accessoryIds: string[];
  rationale: string;
  status: 'generated' | 'worn' | 'retired';
}

export interface WornToday {
  id: string;
  date: string;
  outfitId: string;
  rating: '1' | '2' | '3' | '4' | '5';
  whatWorked?: string;
  whatDidnt?: string;
  notes?: string;
  weather?: string;
  occasion?: string;
}

export type NotionPage = PageObjectResponse;
export type NotionDatabase = DatabaseObjectResponse;
