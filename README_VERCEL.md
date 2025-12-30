# Deploying Notus Platform to Vercel

This project has been rebuilt to support a hybrid deployment architecture: **Vercel** for the application layer and **RunPod** for the LLM engine.

## Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **RunPod Account**: Sign up at [runpod.io](https://runpod.io) and deploy the Nemotron-3 Nano model as per the implementation guide.
3.  **Database**: A managed MySQL/TiDB database (e.g., [TiDB Cloud](https://tidbcloud.com)).

## Deployment Steps

### 1. Connect to Vercel
- Import your `notus-platform` repository into Vercel.
- Vercel will automatically detect the `vercel.json` configuration.

### 2. Configure Environment Variables
In the Vercel project settings, add the following environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Your MySQL/TiDB connection string. |
| `LLM_BASE_URL` | Your RunPod endpoint (e.g., `http://[IP]:8000/v1`). |
| `LLM_API_KEY` | Your RunPod API key. |
| `CRON_SECRET` | A long, random string to secure your cron jobs. |
| `COOKIE_SECRET` | A long, random string for session security. |
| `APP_ID` | Your Manus App ID (for OAuth). |
| `OAUTH_SERVER_URL` | The Manus OAuth server URL. |

### 3. Run Database Migrations
Before the first run, ensure your database schema is up to date:
```bash
pnpm db:push
```

### 4. Verify Cron Jobs
Vercel will automatically pick up the cron job configurations from `vercel.json`. You can monitor and manually trigger them from the **Settings > Cron Jobs** tab in the Vercel dashboard.

## Architecture Notes
- **Frontend**: Served via Vercel's Global Edge Network.
- **Backend API**: Runs as Vercel Serverless Functions (see `api/index.ts`).
- **Cron Jobs**: Triggered by Vercel's native cron system (see `api/cron.ts`).
- **LLM Engine**: Hosted on RunPod for high-performance inference.

---
**Author:** Manus AI
**Date:** December 28, 2025
