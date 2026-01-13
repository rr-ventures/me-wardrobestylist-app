# Setup Guide

This guide walks you through setting up the Notion Wardrobe Stylist from scratch.

## Prerequisites

- Notion account
- Google Cloud account with Gemini API access
- Railway account (free tier works)
- GitHub account (for deployment)

## Step 1: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Fill in:
   - **Name**: "Wardrobe Stylist"
   - **Type**: Internal
   - **Associated workspace**: Your workspace
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (starts with `secret_`)
   - This is your `NOTION_API_KEY`

## Step 2: Create Notion Databases

You need to create 5 databases in Notion. See [SCHEMA.md](./SCHEMA.md) for exact property configurations.

### Quick Setup

1. Create a new page in Notion (e.g., "Wardrobe Stylist")
2. Create 5 database tables with these names:
   - **Wardrobe**
   - **Style Inspo**
   - **Outfit Requests**
   - **My Outfits**
   - **Worn Today**

3. For each database:
   - Click the "..." menu → **"Connections"**
   - Add your "Wardrobe Stylist" integration
   - This gives the integration access to read/write

4. Configure properties according to [SCHEMA.md](./SCHEMA.md)

### Get Database IDs

1. Open each database in Notion
2. Look at the URL: `https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
3. The long string of characters (32 chars, with dashes) is the database ID
4. Copy each database ID - you'll need them for environment variables

## Step 3: Set Up Google Gemini API

1. Go to https://makersuite.google.com/app/apikey or https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the API key - this is your `GEMINI_API_KEY`
4. (Optional) Set up billing if needed - Gemini 2.0 Flash is very cost-effective

## Step 4: Set Up Railway Project

### Option A: Deploy from GitHub (Recommended)

1. Push this code to a GitHub repository
2. Go to https://railway.app
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Railway will auto-detect Node.js and start building

### Option B: Deploy from CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Step 5: Configure Railway Environment Variables

In Railway dashboard, go to your project → **Variables** tab, and add:

```
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_WEBHOOK_SECRET=your_random_secret_here
NOTION_DB_WARDROBE=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_STYLE_INSPO=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_OUTFIT_REQUESTS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_MY_OUTFITS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_WORN_TODAY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GEMINI_API_KEY=your_gemini_api_key_here
RAILWAY_ENVIRONMENT=production
LOG_LEVEL=info
POLL_INTERVAL_MS=30000
```

**Note**: `POLL_INTERVAL_MS` is optional (defaults to 30000ms = 30 seconds). Adjust if you want faster/slower polling.
```

**Important**: 
- Generate a random string for `NOTION_WEBHOOK_SECRET` (e.g., use `openssl rand -hex 32`)
- Replace all database IDs with your actual IDs from Step 2
- Railway automatically sets `PORT` - don't override it

## Step 6: Get Railway Service URL

1. In Railway dashboard, go to your service
2. Click **"Settings"** → **"Generate Domain"**
3. Copy the public URL (e.g., `https://your-app.up.railway.app`)
4. This is your webhook URL: `https://your-app.up.railway.app/api/webhook/notion`

## Step 7: Automatic Polling (No Webhook Setup Needed!)

**Good news**: The service automatically polls for new outfit requests every 30 seconds. No webhook setup required!

The service will:
- Check for pending requests every 30 seconds (configurable via `POLL_INTERVAL_MS`)
- Process requests automatically when found
- Update status in Notion as it processes

**Optional**: If you want to use webhooks in the future (via third-party services like Zapier, Make.com, or n8n), the webhook endpoint is available at `/api/webhook/notion`.

## Step 8: Test the Setup

1. **Add test data**:
   - Add 5-10 wardrobe items to the Wardrobe database
   - Add 2-3 style inspiration items
   - Mark at least one inspo item with `Like = true`

2. **Create a test request**:
   - In Outfit Requests database, create a new row
   - Set `Context`: "Casual dinner, warm weather, relaxed vibe"
   - Set `Number_of_Options`: 3
   - Set `Status`: `pending`

3. **Wait for automatic processing**:
   - The service polls every 30 seconds automatically
   - Within 30-60 seconds, the request should be processed
   - Check Railway logs to see processing in real-time

4. **Verify results**:
   - Check `My Outfits` database - should see 3 new outfits
   - Check `Outfit Requests` - Status should be `done`
   - Each outfit should have relations to wardrobe items

## Troubleshooting

### Service won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure database IDs are correct (32 characters with dashes)

### Outfits not generating
- Check Railway logs for Gemini API errors
- Verify `GEMINI_API_KEY` is valid
- Check that wardrobe items have `Status = active`
- Verify request has `Context` field populated

### Webhook not receiving requests
- Verify webhook URL is correct
- Check `NOTION_WEBHOOK_SECRET` matches
- Check Railway logs for incoming requests
- Verify Notion integration has access to databases

### Database access errors
- Ensure integration is connected to all 5 databases
- Check database IDs in environment variables
- Verify integration has "Can edit" permissions

## Next Steps

- Add more wardrobe items (aim for 30-50+)
- Add style inspiration images
- Start logging worn outfits for feedback
- Experiment with different contexts and constraints

## Local Development

To test locally:

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your values

# Run in dev mode
npm run dev
```

For webhook testing locally, use [ngrok](https://ngrok.com/):

```bash
# Install ngrok
# Then expose local port
ngrok http 3000

# Use the ngrok URL for webhook: https://xxxx.ngrok.io/api/webhook/notion
```
