# Deployment Guide

## Quick Start Checklist

✅ **Dependencies installed** - Run `npm install` (already done)

✅ **Notion Databases** - Use prompts in `notion-ai-prompts.md`

✅ **Environment Variables** - Set up in Railway dashboard

✅ **Railway Deployment** - Push to GitHub and connect to Railway

✅ **Web UI** - Access at `https://your-app.up.railway.app`

## Step-by-Step Deployment

### 1. Create Notion Databases

Open `notion-ai-prompts.md` and copy each prompt into Notion AI to create the 5 databases.

### 2. Get Database IDs

For each database:
1. Open the database in Notion
2. Look at the URL: `https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
3. Copy the 32-character ID (with dashes)

### 3. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Name it "Wardrobe Stylist"
4. Copy the **Internal Integration Token** (starts with `secret_`)

### 4. Connect Integration to Databases

For each of the 5 databases:
1. Open the database
2. Click "..." menu → "Connections"
3. Add your "Wardrobe Stylist" integration

### 5. Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy it

### 6. Deploy to Railway

#### Option A: From GitHub (Recommended)

1. Push this code to a GitHub repository
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect and start building

#### Option B: From CLI

```bash
railway login
railway init
railway up
```

### 7. Configure Environment Variables in Railway

In Railway dashboard → Your Project → Variables, add:

```
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_WEBHOOK_SECRET=<generate with: openssl rand -hex 32>
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

**Important**: Railway automatically sets `PORT` - don't override it.

### 8. Get Your Service URL

1. In Railway → Settings → Generate Domain
2. Copy the URL (e.g., `https://your-app.up.railway.app`)

### 9. Test the Setup

1. **Via Web UI**: Visit `https://your-app.up.railway.app` and create an outfit request
2. **Via Notion**: Create a request directly in the Outfit Requests database
3. **Check logs**: Railway → Deployments → View Logs

### 10. Verify It Works

1. Add some wardrobe items to Notion
2. Create an outfit request (via web UI or Notion)
3. Wait 30-60 seconds
4. Check "My Outfits" database - outfits should appear!

## Troubleshooting

### Build Fails on Railway

- Check Railway logs for errors
- Verify `package.json` has correct build script
- Ensure Node.js version is 18+ (set in `package.json` engines)

### Service Won't Start

- Check all environment variables are set
- Verify database IDs are correct (32 chars with dashes)
- Check Railway logs for startup errors

### Outfits Not Generating

- Check Railway logs for Gemini API errors
- Verify `GEMINI_API_KEY` is valid
- Ensure wardrobe items have `Status = active`
- Check that request has `Context` field populated

### Web UI Not Loading

- Verify static files are being served
- Check that `dist/public` folder exists after build
- Check Railway logs for file serving errors

## Local Development

```bash
# Install dependencies
npm install

# Set up .env file (copy from .env.example and fill in values)

# Run in dev mode
npm run dev

# Test setup
npm run test-setup

# Build for production
npm run build
```

## Testing

Run the setup test to verify everything is configured correctly:

```bash
npm run test-setup
```

This will:
- Test connection to all 5 Notion databases
- Verify you can read/write data
- Check that all properties are correctly configured
