# Gemini API Setup Guide

Your backend has been converted to use **Google Gemini** instead of Claude API.

## Quick Setup (2 minutes)

### Step 1: Get Your Free Gemini API Key

1. Go to https://aistudio.google.com/
2. Click on **"Create API Key"** button (top left)
3. Select **"Create new API key in new project"**
4. Copy the generated API key

### Step 2: Add API Key to `.env`

Edit `backend/.env` and update this line:

```
GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the key you copied. Example:

```
GEMINI_API_KEY=AIzaSyD_example_key_abc123xyz
```

### Step 3: Restart the Backend

Kill any running backend process and restart:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Test It

Send a message via the frontend at http://localhost:3002

You should see:
- Real AI responses from Gemini (no "offline" messages)
- Risk level assessment (green/amber/red)
- Relevant hotlines

## What Changed

| Before | After |
|--------|-------|
| Claude API | Google Gemini |
| `claude.py` | `gemini.py` |
| `CLAUDE_API_KEY` | `GEMINI_API_KEY` |
| `get_claude_client()` | `get_gemini_client()` |

## Fallback Mode

If your API key is missing or Gemini is unavailable, the system automatically falls back to **heuristic offline mode** with keyword-based risk assessment. This is perfect for demonstrations.

## Free Tier Limits

- **Rate limit**: 60 requests per minute
- **Daily limit**: Generous free tier
- **Cost**: Completely free for testing/development

## Support

If you encounter any issues:
1. Verify API key is copied correctly (no spaces)
2. Check `.env` file exists in `backend/` folder
3. Make sure backend is restarted after adding key
4. Check browser console for error messages

For more info: https://ai.google.dev/docs
