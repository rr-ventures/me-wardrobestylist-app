# Notion Wardrobe Stylist

Personal AI styling system using Notion as data layer and UI, Gemini as styling engine, webhook-triggered automation on Railway.

## Overview

This application automates outfit generation by:
1. Reading your wardrobe, style inspiration, and feedback from Notion databases
2. Using Google Gemini AI to generate contextual outfit recommendations
3. Creating outfit pages in Notion with proper relations to wardrobe items
4. Learning from your feedback to improve future suggestions

**No custom frontend needed** - everything happens in Notion via webhooks.

## Features

- 🤖 AI-powered outfit generation using Gemini 2.0 Flash
- 📝 All data stored in Notion (no separate database)
- 🔄 Webhook-triggered automation (create a request, get outfits automatically)
- 📊 Feedback loop for continuous improvement
- 🎯 Context-aware suggestions (weather, occasion, constraints)
- 🔁 Automatic retry logic with fallback models

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Deployment**: Railway (always-on webhook service)
- **Database**: Notion (via API)
- **AI Engine**: Google Gemini 2.0 Flash (primary) / 2.0 Flash (fallback)
- **Framework**: Express.js

## Quick Start

1. **Set up Notion databases** - See [docs/SETUP.md](./docs/SETUP.md) for detailed instructions
2. **Configure environment variables** - Copy `.env.example` to `.env` and fill in your keys
3. **Deploy to Railway** - Connect your GitHub repo and configure environment variables
4. **Set up webhook** - Point Notion webhook to your Railway service URL

For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md).

## Project Structure

```
/
├── src/
│   ├── index.ts                 # Express server + webhook endpoint
│   ├── services/
│   │   ├── notion.service.ts    # Notion API client + helpers
│   │   ├── gemini.service.ts    # Gemini API client + prompt builder
│   │   └── outfit.service.ts    # Orchestration logic
│   ├── types/
│   │   ├── notion.types.ts       # Notion DB schemas
│   │   ├── gemini.types.ts       # Gemini request/response types
│   │   └── outfit.types.ts       # Internal outfit models
│   ├── utils/
│   │   ├── logger.ts             # Structured logging
│   │   ├── validator.ts          # JSON schema validation
│   │   └── retry.ts              # Retry logic with backoff
│   └── config/
│       └── env.ts                # Environment variable loading
├── docs/
│   ├── SETUP.md                  # Setup instructions
│   └── SCHEMA.md                 # Database schema reference
├── railway.json                  # Railway deployment config
└── package.json
```

## Usage

1. **Add wardrobe items** to the Wardrobe database in Notion
2. **Add style inspiration** to the Style Inspo database
3. **Create an Outfit Request** with:
   - Context: "Dinner at nice restaurant, 28C, smart casual, avoid black"
   - Constraints: (optional) "No wool, must be comfortable"
   - Number of Options: 5 (default)
4. **Wait ~30-60 seconds** - the service automatically polls and processes your request
5. **Check My Outfits** database for generated outfits
6. **Log worn outfits** in Worn Today to improve future suggestions

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

The service automatically polls for new requests every 30 seconds - no webhook setup needed!

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `NOTION_API_KEY` - Your Notion integration token
- `NOTION_WEBHOOK_SECRET` - Secret for webhook validation
- `GEMINI_API_KEY` - Google Gemini API key
- `NOTION_DB_*` - Database IDs for all 5 databases

## Railway Deployment

The service is configured to:
- Listen on `$PORT` (Railway provides this)
- Expose `/health` endpoint for health checks
- Handle webhook requests at `/api/webhook/notion`

See [docs/SETUP.md](./docs/SETUP.md) for Railway setup steps.

## Database Schemas

See [docs/SCHEMA.md](./docs/SCHEMA.md) for detailed Notion database schemas.

## License

MIT
