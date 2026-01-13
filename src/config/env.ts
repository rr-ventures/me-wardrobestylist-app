import * as dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  notionApiKey: string;
  notionWebhookSecret: string;
  notionDbWardrobe: string;
  notionDbStyleInspo: string;
  notionDbOutfitRequests: string;
  notionDbMyOutfits: string;
  notionDbWornToday: string;
  geminiApiKey: string;
  port: number;
  railwayEnvironment: string;
  logLevel: string;
  pollIntervalMs: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(): EnvConfig {
  return {
    notionApiKey: getEnvVar('NOTION_API_KEY'),
    notionWebhookSecret: getEnvVar('NOTION_WEBHOOK_SECRET'),
    notionDbWardrobe: getEnvVar('NOTION_DB_WARDROBE'),
    notionDbStyleInspo: getEnvVar('NOTION_DB_STYLE_INSPO'),
    notionDbOutfitRequests: getEnvVar('NOTION_DB_OUTFIT_REQUESTS'),
    notionDbMyOutfits: getEnvVar('NOTION_DB_MY_OUTFITS'),
    notionDbWornToday: getEnvVar('NOTION_DB_WORN_TODAY'),
    geminiApiKey: getEnvVar('GEMINI_API_KEY'),
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    railwayEnvironment: getEnvVar('RAILWAY_ENVIRONMENT', 'development'),
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    pollIntervalMs: parseInt(getEnvVar('POLL_INTERVAL_MS', '30000'), 10),
  };
}
