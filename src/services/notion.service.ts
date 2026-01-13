import { Client } from '@notionhq/client';
import {
  PageObjectResponse,
  DatabaseObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';
import {
  WardrobeItem,
  StyleInspo,
  OutfitRequest,
  MyOutfit,
  WornToday,
} from '../types/notion.types';
import { getLogger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

export class NotionService {
  private client: Client;
  private logger = getLogger();

  constructor(apiKey: string) {
    this.client = new Client({ auth: apiKey });
  }

  // Wardrobe operations
  async getActiveWardrobeItems(): Promise<WardrobeItem[]> {
    const response = await retryWithBackoff(() =>
      this.client.databases.query({
        database_id: process.env.NOTION_DB_WARDROBE!,
        filter: {
          property: 'Status',
          select: {
            equals: 'active',
          },
        },
      })
    );

    return this.parseWardrobeItems(response.results as PageObjectResponse[]);
  }

  private parseWardrobeItems(pages: PageObjectResponse[]): WardrobeItem[] {
    return pages.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        name: this.getTitle(props.Name),
        category: this.getSelect(props.Category) as WardrobeItem['category'],
        colors: this.getMultiSelect(props.Colors),
        pattern: this.getSelect(props.Pattern) as WardrobeItem['pattern'],
        material: this.getSelect(props.Material) || undefined,
        season: this.getMultiSelect(props.Season),
        formality: this.getSelect(props.Formality) as WardrobeItem['formality'],
        fitNotes: this.getRichText(props.Fit_Notes) || undefined,
        purchaseLink: this.getUrl(props.Purchase_Link) || undefined,
        status: this.getSelect(props.Status) as WardrobeItem['status'],
        imageUrls: this.getFiles(props.Image),
      };
    });
  }

  // Style inspo operations
  async getLikedStyleInspo(): Promise<StyleInspo[]> {
    const response = await retryWithBackoff(() =>
      this.client.databases.query({
        database_id: process.env.NOTION_DB_STYLE_INSPO!,
        filter: {
          property: 'Like',
          checkbox: {
            equals: true,
          },
        },
      })
    );

    return this.parseStyleInspo(response.results as PageObjectResponse[]);
  }

  private parseStyleInspo(pages: PageObjectResponse[]): StyleInspo[] {
    return pages.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        name: this.getTitle(props.Name),
        imageUrls: this.getFiles(props.Image),
        vibeTags: this.getMultiSelect(props.Vibe_Tags),
        like: this.getCheckbox(props.Like),
        why: this.getRichText(props.Why) || undefined,
        sourceUrl: this.getUrl(props.Source_URL) || undefined,
      };
    });
  }

  // Worn today operations (for feedback)
  async getRecentWornFeedback(days: number = 30): Promise<WornToday[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const response = await retryWithBackoff(() =>
      this.client.databases.query({
        database_id: process.env.NOTION_DB_WORN_TODAY!,
        filter: {
          property: 'Date',
          date: {
            on_or_after: cutoffDate.toISOString().split('T')[0],
          },
        },
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      })
    );

    return this.parseWornToday(response.results as PageObjectResponse[]);
  }

  private parseWornToday(pages: PageObjectResponse[]): WornToday[] {
    return pages.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        date: this.getDate(props.Date) || '',
        outfitId: this.getRelation(props.Outfit)[0] || '',
        rating: this.getSelect(props.Rating) as WornToday['rating'],
        whatWorked: this.getRichText(props.What_Worked) || undefined,
        whatDidnt: this.getRichText(props.What_Didnt) || undefined,
        notes: this.getRichText(props.Notes) || undefined,
        weather: this.getRichText(props.Weather) || undefined,
        occasion: this.getRichText(props.Occasion) || undefined,
      };
    });
  }

  // Outfit request operations
  async getPendingOutfitRequests(): Promise<OutfitRequest[]> {
    const response = await retryWithBackoff(() =>
      this.client.databases.query({
        database_id: process.env.NOTION_DB_OUTFIT_REQUESTS!,
        filter: {
          property: 'Status',
          select: {
            equals: 'pending',
          },
        },
        sorts: [
          {
            property: 'Request_Date',
            direction: 'ascending',
          },
        ],
      })
    );

    return this.parseOutfitRequests(response.results as PageObjectResponse[]);
  }

  async getOutfitRequest(requestId: string): Promise<OutfitRequest | null> {
    try {
      const page = await retryWithBackoff(() =>
        this.client.pages.retrieve({ page_id: requestId })
      );

      return this.parseOutfitRequest(page as PageObjectResponse);
    } catch (error) {
      this.logger.error('Failed to get outfit request', error);
      return null;
    }
  }

  private parseOutfitRequests(pages: PageObjectResponse[]): OutfitRequest[] {
    return pages.map(page => this.parseOutfitRequest(page));
  }

  async createOutfitRequest(request: {
    context: string;
    constraints?: string;
    numberOfOptions?: number;
    requestDate?: string;
  }): Promise<string> {
    const properties: any = {
      Context: {
        rich_text: [
          {
            text: {
              content: request.context,
            },
          },
        ],
      },
      Status: {
        select: {
          name: 'pending',
        },
      },
      Number_of_Options: {
        number: request.numberOfOptions || 5,
      },
    };

    if (request.constraints) {
      properties.Constraints = {
        rich_text: [
          {
            text: {
              content: request.constraints,
            },
          },
        ],
      };
    }

    if (request.requestDate) {
      properties.Request_Date = {
        date: {
          start: request.requestDate,
        },
      };
    }

    const page = await retryWithBackoff(() =>
      this.client.pages.create({
        parent: {
          database_id: process.env.NOTION_DB_OUTFIT_REQUESTS!,
        },
        properties,
      })
    );

    return page.id;
  }

  async updateRequestStatus(
    requestId: string,
    status: OutfitRequest['status'],
    errorMessage?: string
  ): Promise<void> {
    const update: any = {
      page_id: requestId,
      properties: {
        Status: {
          select: {
            name: status,
          },
        },
      },
    };

    if (errorMessage) {
      update.properties.Error_Message = {
        rich_text: [
          {
            text: {
              content: errorMessage,
            },
          },
        ],
      };
    }

    await retryWithBackoff(() => this.client.pages.update(update));
  }

  private parseOutfitRequest(page: PageObjectResponse): OutfitRequest {
    const props = page.properties;
    return {
      id: page.id,
      requestDate: this.getDate(props.Request_Date) || null,
      context: this.getRichText(props.Context) || '',
      constraints: this.getRichText(props.Constraints) || undefined,
      numberOfOptions: this.getNumber(props.Number_of_Options) || 5,
      status: this.getSelect(props.Status) as OutfitRequest['status'],
      errorMessage: this.getRichText(props.Error_Message) || undefined,
      generatedOutfits: this.getRelation(props.Generated_Outfits),
    };
  }

  // Create outfit pages
  async createOutfit(
    outfit: {
      name: string;
      requestId: string;
      itemsJson: string;
      topId?: string;
      bottomId?: string;
      dressId?: string;
      outerwearId?: string;
      shoesId?: string;
      accessoryIds: string[];
      rationale: string;
    }
  ): Promise<string> {
    const relations: any = {
      Request: {
        relation: [{ id: outfit.requestId }],
      },
      Items_JSON: {
        rich_text: [
          {
            text: {
              content: outfit.itemsJson,
            },
          },
        ],
      },
      Rationale: {
        rich_text: [
          {
            text: {
              content: outfit.rationale,
            },
          },
        ],
      },
      Status: {
        select: {
          name: 'generated',
        },
      },
    };

    if (outfit.topId) {
      relations.Top = { relation: [{ id: outfit.topId }] };
    }
    if (outfit.bottomId) {
      relations.Bottom = { relation: [{ id: outfit.bottomId }] };
    }
    if (outfit.dressId) {
      relations.Dress = { relation: [{ id: outfit.dressId }] };
    }
    if (outfit.outerwearId) {
      relations.Outerwear = { relation: [{ id: outfit.outerwearId }] };
    }
    if (outfit.shoesId) {
      relations.Shoes = { relation: [{ id: outfit.shoesId }] };
    }
    if (outfit.accessoryIds.length > 0) {
      relations.Accessories = {
        relation: outfit.accessoryIds.map(id => ({ id })),
      };
    }

    const page = await retryWithBackoff(() =>
      this.client.pages.create({
        parent: {
          database_id: process.env.NOTION_DB_MY_OUTFITS!,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: outfit.name,
                },
              },
            ],
          },
          ...relations,
        },
      })
    );

    return page.id;
  }

  // Helper methods for parsing Notion properties
  private getTitle(prop: any): string {
    if (prop?.type === 'title' && prop.title?.length > 0) {
      return prop.title.map((t: any) => t.plain_text).join('');
    }
    return '';
  }

  private getRichText(prop: any): string | null {
    if (prop?.type === 'rich_text' && prop.rich_text?.length > 0) {
      return prop.rich_text.map((t: any) => t.plain_text).join('');
    }
    return null;
  }

  private getSelect(prop: any): string | null {
    if (prop?.type === 'select' && prop.select) {
      return prop.select.name;
    }
    return null;
  }

  private getMultiSelect(prop: any): string[] {
    if (prop?.type === 'multi_select' && prop.multi_select) {
      return prop.multi_select.map((s: any) => s.name);
    }
    return [];
  }

  private getCheckbox(prop: any): boolean {
    if (prop?.type === 'checkbox') {
      return prop.checkbox;
    }
    return false;
  }

  private getNumber(prop: any): number | null {
    if (prop?.type === 'number') {
      return prop.number;
    }
    return null;
  }

  private getDate(prop: any): string | null {
    if (prop?.type === 'date' && prop.date) {
      return prop.date.start;
    }
    return null;
  }

  private getUrl(prop: any): string | null {
    if (prop?.type === 'url' && prop.url) {
      return prop.url;
    }
    return null;
  }

  private getFiles(prop: any): string[] {
    if (prop?.type === 'files' && prop.files) {
      return prop.files
        .map((f: any) => {
          if (f.type === 'file' && f.file?.url) {
            return f.file.url;
          }
          if (f.type === 'external' && f.external?.url) {
            return f.external.url;
          }
          return null;
        })
        .filter((url: string | null) => url !== null);
    }
    return [];
  }

  private getRelation(prop: any): string[] {
    if (prop?.type === 'relation' && prop.relation) {
      return prop.relation.map((r: any) => r.id);
    }
    return [];
  }
}
