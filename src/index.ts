import express, { Request, Response } from 'express';
import path from 'path';
import { loadConfig } from './config/env';
import { NotionService } from './services/notion.service';
import { GeminiService } from './services/gemini.service';
import { OutfitService } from './services/outfit.service';
import { PollingService } from './services/polling.service';
import { getLogger } from './utils/logger';
import { OutfitGenerationInput } from './types/outfit.types';

const config = loadConfig();
const logger = getLogger(config.logLevel);

const app = express();
app.use(express.json());

// Serve static files (web UI)
// In production: dist/public, in dev: src/public
const publicPath = path.join(__dirname, process.env.NODE_ENV === 'production' ? '../public' : '../../src/public');
app.use(express.static(publicPath));

// Root route - serve the web UI
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Initialize services
const notionService = new NotionService(config.notionApiKey);
const geminiService = new GeminiService(config.geminiApiKey);
const outfitService = new OutfitService(notionService, geminiService);
const pollingService = new PollingService(notionService, outfitService);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint to create outfit request from web UI
app.post('/api/outfit-request', async (req: Request, res: Response) => {
  try {
    const { context, constraints, numberOfOptions } = req.body;

    if (!context || typeof context !== 'string' || context.trim().length === 0) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const numOptions = numberOfOptions ? parseInt(String(numberOfOptions), 10) : 5;
    if (isNaN(numOptions) || numOptions < 1 || numOptions > 10) {
      return res.status(400).json({ error: 'Number of options must be between 1 and 10' });
    }

    logger.info('Creating outfit request from web UI', { context, constraints, numOptions });

    // Create request in Notion
    const requestId = await notionService.createOutfitRequest({
      context: context.trim(),
      constraints: constraints?.trim() || undefined,
      numberOfOptions: numOptions,
    });

    logger.info('Outfit request created', { requestId });

    res.status(201).json({
      success: true,
      requestId,
      message: 'Outfit request created successfully. Outfits will be generated within 30-60 seconds.',
    });
  } catch (error) {
    logger.error('Failed to create outfit request', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create outfit request',
    });
  }
});

// Webhook endpoint
app.post('/api/webhook/notion', async (req: Request, res: Response) => {
  try {
    // Validate webhook secret (basic check - Notion doesn't provide signature in v1)
    const webhookSecret = req.headers['x-notion-webhook-secret'] as string;
    if (webhookSecret !== config.notionWebhookSecret) {
      logger.warn('Invalid webhook secret', { received: webhookSecret });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Received webhook from Notion', { body: req.body });

    // Extract request ID from webhook payload
    // Notion webhook format may vary - adjust based on actual payload structure
    const payload = req.body;
    let requestId: string | null = null;

    // Try to extract page ID from different possible webhook formats
    if (payload.object === 'page' && payload.id) {
      requestId = payload.id;
    } else if (payload.data?.object === 'page' && payload.data?.id) {
      requestId = payload.data.id;
    } else if (payload.page_id) {
      requestId = payload.page_id;
    }

    if (!requestId) {
      logger.warn('Could not extract request ID from webhook', { payload });
      return res.status(400).json({ error: 'Missing page ID in webhook payload' });
    }

    // Respond quickly to Notion (process async)
    res.status(200).json({ received: true, requestId });

    // Process asynchronously
    processOutfitRequest(requestId).catch(error => {
      logger.error('Async processing failed', error, { requestId });
    });
  } catch (error) {
    logger.error('Webhook handler error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processOutfitRequest(requestId: string): Promise<void> {
  try {
    logger.info('Processing outfit request', { requestId });

    // Update status to processing
    await notionService.updateRequestStatus(requestId, 'processing');

    // Fetch the request
    const request = await notionService.getOutfitRequest(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Validate request
    if (request.status !== 'pending' && request.status !== 'processing') {
      logger.info('Request already processed', { requestId, status: request.status });
      return;
    }

    if (!request.context || request.context.trim().length === 0) {
      throw new Error('Request context is required');
    }

    // Generate outfits
    const input: OutfitGenerationInput = {
      requestId,
      context: request.context,
      constraints: request.constraints,
      numberOfOptions: request.numberOfOptions || 5,
    };

    const result = await outfitService.generateOutfits(input);

    if (result.success) {
      await notionService.updateRequestStatus(requestId, 'done');
      logger.info('Outfit generation completed successfully', { requestId });
    } else {
      await notionService.updateRequestStatus(
        requestId,
        'error',
        result.error || 'Unknown error occurred'
      );
      logger.error('Outfit generation failed', { requestId, error: result.error });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to process outfit request', error, { requestId });
    
    try {
      await notionService.updateRequestStatus(requestId, 'error', errorMessage);
    } catch (updateError) {
      logger.error('Failed to update request status', updateError, { requestId });
    }
  }
}

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: config.railwayEnvironment,
    port: PORT,
  });

  // Start polling service (checks for pending requests every 30 seconds)
  // This is the primary mechanism since Notion doesn't have native webhooks
  pollingService.start(config.pollIntervalMs);
  logger.info('Polling service started', { intervalMs: config.pollIntervalMs });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  pollingService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  pollingService.stop();
  process.exit(0);
});
