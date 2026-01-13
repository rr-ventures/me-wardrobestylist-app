import { NotionService } from './notion.service';
import { OutfitService } from './outfit.service';
import { OutfitRequest } from '../types/notion.types';
import { OutfitGenerationInput } from '../types/outfit.types';
import { getLogger } from '../utils/logger';

export class PollingService {
  private notionService: NotionService;
  private outfitService: OutfitService;
  private logger = getLogger();
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(notionService: NotionService, outfitService: OutfitService) {
    this.notionService = notionService;
    this.outfitService = outfitService;
  }

  start(intervalMs: number = 30000): void {
    if (this.intervalId) {
      this.logger.warn('Polling service already started');
      return;
    }

    this.logger.info('Starting polling service', { intervalMs });
    
    // Poll immediately on start
    this.poll();

    // Then poll at intervals
    this.intervalId = setInterval(() => {
      this.poll();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Polling service stopped');
    }
  }

  private async poll(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Skipping poll - already processing');
      return;
    }

    try {
      this.isProcessing = true;
      
      // Query for pending requests
      const pendingRequests = await this.getPendingRequests();
      
      if (pendingRequests.length === 0) {
        this.logger.debug('No pending requests found');
        return;
      }

      this.logger.info(`Found ${pendingRequests.length} pending request(s)`);

      // Process each pending request
      for (const request of pendingRequests) {
        await this.processRequest(request);
      }
    } catch (error) {
      this.logger.error('Polling error', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async getPendingRequests(): Promise<OutfitRequest[]> {
    try {
      return await this.notionService.getPendingOutfitRequests();
    } catch (error) {
      this.logger.error('Failed to query pending requests', error);
      return [];
    }
  }

  private async processRequest(request: OutfitRequest): Promise<void> {
    try {
      this.logger.info('Processing outfit request', { requestId: request.id });

      // Update status to processing
      await this.notionService.updateRequestStatus(request.id, 'processing');

      // Validate request
      if (!request.context || request.context.trim().length === 0) {
        throw new Error('Request context is required');
      }

      // Generate outfits
      const input: OutfitGenerationInput = {
        requestId: request.id,
        context: request.context,
        constraints: request.constraints,
        numberOfOptions: request.numberOfOptions || 5,
      };

      const result = await this.outfitService.generateOutfits(input);

      if (result.success) {
        await this.notionService.updateRequestStatus(request.id, 'done');
        this.logger.info('Outfit generation completed successfully', { requestId: request.id });
      } else {
        await this.notionService.updateRequestStatus(
          request.id,
          'error',
          result.error || 'Unknown error occurred'
        );
        this.logger.error('Outfit generation failed', { requestId: request.id, error: result.error });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process outfit request', error, { requestId: request.id });
      
      try {
        await this.notionService.updateRequestStatus(request.id, 'error', errorMessage);
      } catch (updateError) {
        this.logger.error('Failed to update request status', updateError, { requestId: request.id });
      }
    }
  }
}
