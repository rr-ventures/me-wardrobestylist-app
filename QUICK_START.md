# 🚀 Quick Start Guide

## ✅ What's Been Done

1. **✅ Dependencies Installed** - All npm packages installed
2. **✅ Gemini Updated** - Using `gemini-2.0-flash-exp` (with NanoBanana Pro image processing)
3. **✅ Web UI Created** - Beautiful interface at `/` to create outfit requests
4. **✅ API Endpoints** - `/api/outfit-request` for creating requests via web UI
5. **✅ Railway Ready** - Configured for automatic deployment from Git
6. **✅ Test Script** - `npm run test-setup` to verify Notion connection

## 📋 What You Need to Do

### 1. Create Notion Databases (5 minutes)

Open `notion-ai-prompts.md` and copy each prompt into Notion AI. This will create all 5 databases with the correct schemas.

**After creating databases:**
- Get the database ID from each URL (32 characters with dashes)
- Connect your Notion integration to each database

### 2. Set Up Environment Variables

The `.env` file is already created with placeholders. You need to fill in:

```bash
# Get from notion.so/my-integrations
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Generate with: openssl rand -hex 32
NOTION_WEBHOOK_SECRET=your_random_secret_here

# Get from Notion database URLs
NOTION_DB_WARDROBE=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_STYLE_INSPO=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_OUTFIT_REQUESTS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_MY_OUTFITS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NOTION_DB_WORN_TODAY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Get from aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Test Locally (Optional)

```bash
# Fill in .env file first, then:
npm run dev

# In another terminal, test the setup:
npm run test-setup
```

Visit `http://localhost:3000` to see the web UI.

### 4. Deploy to Railway

1. **Push to GitHub** (if not already done)
2. **Go to Railway** → New Project → Deploy from GitHub
3. **Add Environment Variables** in Railway dashboard (same as .env)
4. **Wait for deployment** - Railway will build and deploy automatically
5. **Get your URL** - Railway → Settings → Generate Domain

### 5. Use the Web UI!

Visit `https://your-app.up.railway.app` and:
1. Fill in the outfit request form
2. Click "Generate Outfits"
3. Check your Notion "Outfit Requests" database
4. Wait 30-60 seconds
5. See outfits appear in "My Outfits" database! ✨

## 🎯 Key Features

- **Web UI**: No need to manually create requests in Notion
- **Auto-Polling**: Checks for new requests every 30 seconds
- **Image Processing**: Uses Gemini 2.0 Flash with NanoBanana Pro
- **Error Handling**: Comprehensive retry logic and logging
- **Feedback Loop**: Learns from your "Worn Today" entries

## 📚 Documentation

- `notion-ai-prompts.md` - Exact prompts for Notion AI
- `docs/SETUP.md` - Detailed setup instructions
- `docs/SCHEMA.md` - Database schema reference
- `DEPLOYMENT.md` - Railway deployment guide

## 🐛 Troubleshooting

**Service won't start?**
- Check all environment variables are set
- Verify database IDs are correct
- Check Railway logs

**Outfits not generating?**
- Verify wardrobe items have `Status = active`
- Check Gemini API key is valid
- Look at Railway logs for errors

**Web UI not loading?**
- Check that build completed successfully
- Verify `dist/public` folder exists
- Check Railway logs

## 🎉 You're Ready!

Once deployed, you can:
1. Add wardrobe items in Notion
2. Add style inspiration
3. Create outfit requests via the web UI
4. Watch outfits generate automatically!

No manual Notion work needed - just use the web UI and watch the magic happen! ✨
