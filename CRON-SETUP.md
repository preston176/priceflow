# Automated Price Checking with AI - Cron Setup Guide

## Overview

Zawadi now includes **fully automated price checking** using AI (Gemini Vision/Text) to analyze product pages in the background, plus **automatic price updates** for gifts with auto-update enabled. Three cron jobs handle:

1. **AI Price Checks** - Daily automated price verification
2. **Auto-Update Enabled Gifts** - Background updates with email notifications
3. **Weekly Reminders** - Summary emails for users

---

## ⚡ Quick Start

### Using QStash (Recommended - 100% FREE)

1. **Set up environment variables** in `.env`:
   ```bash
   # Get from https://console.upstash.com/qstash
   QSTASH_TOKEN=your_token_here
   QSTASH_CURRENT_SIGNING_KEY=your_current_key
   QSTASH_NEXT_SIGNING_KEY=your_next_key

   # Generate with: openssl rand -base64 32
   CRON_SECRET=your_random_secret

   # Your production URL
   NEXT_PUBLIC_APP_URL=https://zawadi.app
   ```

2. **Run the setup script**:
   ```bash
   source .env
   ./scripts/setup-qstash.sh
   ```

3. **Test locally** (optional):
   ```bash
   bun run dev
   # In another terminal:
   source .env
   ./scripts/test-cron.sh
   ```

That's it! QStash will now run your cron jobs automatically.

---

## 🤖 How It Works

### AI-Powered Price Checking Cron (`/api/cron/check-prices-ai`)

**What it does:**
1. Runs daily (2 AM UTC recommended)
2. Finds all gifts with URLs that haven't been checked in 24+ hours
3. Uses `extractProductMetadata()` AI function to fetch product info
4. Updates current price, creates price history
5. Sends email alerts when prices drop below target
6. Limits to 100 gifts per run to manage API costs

**Smart Features:**
- 2-second delay between requests (respectful to AI API)
- Tracks lowest/highest prices ever
- Only sends alert on **first drop** below target (no spam)
- Updates `lastPriceCheck` even on failures (avoid repeat checks)
- Detailed logging for monitoring

### Auto-Update Enabled Gifts Cron (`/api/cron/auto-update-enabled-gifts`)

**What it does:**
1. Runs daily (6 AM UTC recommended)
2. Finds all gifts with `autoUpdateEnabled=true`
3. Queues background price update jobs via QStash for each gift
4. Staggers updates with 0-5 minute random delays to avoid overwhelming system
5. Updates `lastAutoUpdate` timestamp for tracking
6. Returns count of successful and failed updates

**Smart Features:**
- Uses QStash background workers for non-blocking updates
- Staggered delays prevent API rate limiting
- Two-email flow: start notification + completion with results
- Scrapes existing marketplace URLs first, falls back to SerpAPI search
- Updates all marketplace products for comprehensive price comparison

**Requirements:**
- `QSTASH_TOKEN` for background job scheduling
- `CRON_SECRET` for endpoint authentication
- `NEXT_PUBLIC_APP_URL` for worker callback URLs
- Users must toggle "Auto: ON" in gift card UI

### Weekly Reminder Cron (`/api/cron/weekly-reminders`)

**What it does:**
1. Runs weekly (Sunday 9 AM recommended)
2. Finds users with items needing price checks
3. Calculates current savings and best deals
4. Sends reminder emails with stats
5. Skips users with no items to check

---

## 📅 Cron Schedule Options

### Option 1: Upstash QStash (Recommended - FREE)

**What is QStash?**
- Serverless message queue and cron service by Upstash
- Works with any deployment (Vercel, Railway, self-hosted)
- Automatic retries, dead letter queues
- Built-in rate limiting
- First 100 requests/day FREE

**Setup:**

1. **Sign up for Upstash:** https://console.upstash.com/

2. **Create QStash credentials:**
   - Go to QStash section
   - Copy your QStash token
   - Copy your signing keys (for verification)

3. **Add to `.env`:**
```env
# QStash Configuration
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Cron Security
CRON_SECRET=your_random_secret_here
```

4. **Create QStash schedules:**

**Daily Price Check (2 AM UTC):**
```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://zawadi.app/api/cron/check-prices-ai",
    "cron": "0 2 * * *",
    "headers": {
      "Authorization": "Bearer YOUR_CRON_SECRET"
    }
  }'
```

**Auto-Update Enabled Gifts (6 AM UTC):**
```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://zawadi.app/api/cron/auto-update-enabled-gifts",
    "cron": "0 6 * * *",
    "headers": {
      "Authorization": "Bearer YOUR_CRON_SECRET"
    }
  }'
```

**Weekly Reminders (Sunday 9 AM UTC):**
```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "destination": "https://zawadi.app/api/cron/weekly-reminders",
    "cron": "0 9 * * 0",
    "headers": {
      "Authorization": "Bearer YOUR_CRON_SECRET"
    }
  }'
```

5. **Monitor in QStash Dashboard:**
   - View execution history
   - See success/failure rates
   - Check retry attempts
   - Monitor costs

**Pros:**
- Works everywhere (Vercel, Railway, any host)
- Generous free tier
- Built-in retries and DLQ
- Great monitoring
- Rate limiting included

**Cons:**
- Additional service to manage
- Need to set up manually

---

### Option 2: Vercel Cron (Requires Pro Plan - $20/month)

**Note:** Vercel cron jobs require the **Pro plan** ($20/month). Not recommended unless you already have Pro.

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices-ai",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/auto-update-enabled-gifts",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/weekly-reminders",
      "schedule": "0 9 * * 0"
    }
  ]
}
```

**Pros:**
- Built into Vercel
- No additional setup
- Automatic retries

**Cons:**
- ❌ Requires $20/month Pro plan
- Only works on Vercel

---

### Option 3: GitHub Actions (Free alternative)

**File:** `.github/workflows/price-check.yml`

```yaml
name: Automated Price Checks

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
    - cron: '0 9 * * 0'  # Sunday at 9 AM UTC

jobs:
  price-check:
    runs-on: ubuntu-latest
    steps:
      - name: Daily Price Check
        if: github.event.schedule == '0 2 * * *'
        run: |
          curl -X GET "https://zawadi.app/api/cron/check-prices-ai" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

      - name: Auto-Update Enabled Gifts
        if: github.event.schedule == '0 6 * * *'
        run: |
          curl -X GET "https://zawadi.app/api/cron/auto-update-enabled-gifts" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

      - name: Weekly Reminders
        if: github.event.schedule == '0 9 * * 0'
        run: |
          curl -X GET "https://zawadi.app/api/cron/weekly-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Setup:**
1. Add file to repo
2. Add `CRON_SECRET` to GitHub Secrets
3. Push to GitHub
4. Actions run automatically

**Pros:**
- Completely free
- Works with any deployment
- Easy to set up
- GitHub provides logs

**Cons:**
- Less reliable than paid options
- No automatic retries
- Limited monitoring

---

### Option 4: EasyCron / Cron-Job.org (Simple external)

**Setup:**
1. Sign up at https://www.easycron.com/ or https://cron-job.org/
2. Create three cron jobs:
   - Daily at 2 AM: `https://zawadi.app/api/cron/check-prices-ai`
   - Daily at 6 AM: `https://zawadi.app/api/cron/auto-update-enabled-gifts`
   - Weekly Sunday 9 AM: `https://zawadi.app/api/cron/weekly-reminders`
3. Add Authorization header: `Bearer YOUR_CRON_SECRET`
4. Set schedules

**Pros:**
- Simple web interface
- No code needed
- Works with any deployment

**Cons:**
- Less reliable
- Limited free tier
- Manual setup

---

## 🔒 Security

### Cron Secret Protection

Both cron endpoints check for authorization:

```typescript
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

Add to `.env`:
```env
CRON_SECRET=your_generated_secret_here
```

### Important:
- Keep `CRON_SECRET` private
- Use different secrets for dev/production
- Rotate periodically for security

---

## 💰 Cost Analysis

### AI API Costs (Gemini)

**Assumptions:**
- 50 users
- Each user has 10 gifts with URLs
- Total: 500 gifts checked daily
- Gemini API: ~$0.001-0.005 per request

**Monthly Cost:**
- Daily checks: 500 gifts × 30 days = 15,000 requests
- At $0.002/request = **$30/month**

**Cost Optimization:**
- Limit to 100 gifts per cron run (rotate checks)
- Check only gifts with price tracking enabled
- Use caching for frequently checked products
- Batch requests where possible

### Cron Service Costs

| Service | Free Tier | Paid Cost |
|---------|-----------|-----------|
| Vercel Cron | 1,000/month | $20/month (Pro plan) |
| QStash | 100/day (3,000/month) | $0.10/1K requests |
| GitHub Actions | Unlimited | Free |
| EasyCron | 20 jobs | $0.99/month |

**Recommended: QStash**
- Free tier covers small deployments
- $3/month for 10,000 requests (plenty for most apps)
- Most reliable option

---

## 📊 Monitoring

### Check Cron Execution

**Manual trigger for testing:**
```bash
# Test AI price check
curl -X GET "http://localhost:3000/api/cron/check-prices-ai" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test auto-update enabled gifts
curl -X GET "http://localhost:3000/api/cron/auto-update-enabled-gifts" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test weekly reminders
curl -X GET "http://localhost:3000/api/cron/weekly-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response formats:**

*AI Price Check (`/api/cron/check-prices-ai`):*
```json
{
  "success": true,
  "total": 100,
  "successful": 95,
  "failed": 5,
  "priceDrops": 12,
  "errors": ["..."],
  "message": "Checked 100 gifts. 95 successful, 5 failed, 12 price drops detected."
}
```

*Auto-Update Enabled Gifts (`/api/cron/auto-update-enabled-gifts`):*
```json
{
  "success": true,
  "message": "Queued 25 auto-updates",
  "giftsUpdated": 25,
  "giftsFailed": 0,
  "results": [
    {
      "giftId": "uuid",
      "giftName": "Product Name",
      "success": true,
      "messageId": "qstash-message-id"
    }
  ]
}
```

### Logging

All three cron endpoints log to console:
- Each gift being processed
- Successes and failures
- Price drops detected
- Email alerts sent
- QStash job queueing status

**View logs:**
- **Vercel:** Dashboard > Functions > Filter by endpoint path
- **QStash:** Dashboard > Messages > History
- **GitHub Actions:** Actions tab > Workflow runs
- **Local:** Terminal output when running `bun run dev`

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://zawadi.app
CRON_SECRET=your_random_secret

# Optional (if using QStash)
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key
```

### Pre-Deployment
- [ ] Generate secure `CRON_SECRET`
- [ ] Configure Gemini API key
- [ ] Configure Resend API key
- [ ] Set production APP_URL
- [ ] Choose cron service (Vercel/QStash/GitHub/etc.)
- [ ] Set up schedules
- [ ] Test with manual curl request

### Post-Deployment
- [ ] Verify cron jobs are running
- [ ] Check logs for errors
- [ ] Monitor AI API usage
- [ ] Monitor email delivery
- [ ] Watch for cost alerts
- [ ] Test price drop alert flow

---

## 🎯 Best Practices

### Rate Limiting
Current implementation includes 2-second delays between AI requests. Adjust in code if needed:

```typescript
// In check-prices-ai/route.ts
await new Promise((resolve) => setTimeout(resolve, 2000)); // Adjust delay
```

### Batch Size
Limit to 100 gifts per run to avoid timeouts and high costs:

```typescript
.limit(100); // Adjust batch size
```

### Error Handling
Failed price checks update `lastPriceCheck` to avoid retry loops. Monitor `errors` array in response.

### Testing
Always test cron endpoints locally before deploying:

```bash
# Local test
bun run dev

# In another terminal
curl -X GET "http://localhost:3000/api/cron/check-prices-ai" \
  -H "Authorization: Bearer test-secret"
```

---

## 📧 Email Deliverability

### Resend Setup
1. Add sender domain in Resend dashboard
2. Configure DNS records (SPF, DKIM, DMARC)
3. Verify domain ownership
4. Use verified `from` addresses

### From Addresses
All emails sent from: `noreply@prestonmayieka.com`
- Price alerts
- Weekly reminders
- Daily summaries
- Share invitations

### Monitoring
- Check Resend dashboard for bounce rates
- Monitor spam complaints
- Track open rates
- Adjust email frequency if needed

---

## 🔧 Troubleshooting

### Cron Not Running
- Check cron service dashboard
- Verify schedule syntax
- Check authorization header
- Review logs for errors

### AI Extraction Failing
- Check Gemini API key validity
- Monitor API quota/limits
- Verify product URLs are accessible
- Check `extractProductMetadata()` function

### Emails Not Sending
- Verify Resend API key
- Check domain verification
- Review bounce logs
- Confirm recipient emails

### High Costs
- Reduce batch size (100 → 50)
- Increase check interval (daily → every 2 days)
- Only check gifts with `priceTrackingEnabled: true`
- Cache frequently checked products

---

## Summary

You now have **fully automated price tracking and updates** using AI!

**Recommended Setup (100% FREE):**
- Use **QStash** for cron scheduling (100 requests/day free)
- Deploy on **Vercel Free tier** (or any free host)
- **Daily AI price checks** at 2 AM UTC (passive tracking)
- **Daily auto-updates** at 6 AM UTC (active user-enabled updates)
- **Weekly reminders** on Sundays at 9 AM UTC
- Total: 3 cron jobs = 3 requests/day = **$0/month**

**Next Steps:**
1. Sign up for Upstash QStash (free tier)
2. Set up environment variables (`QSTASH_TOKEN`, `CRON_SECRET`, etc.)
3. Run the QStash schedule setup commands (see Option 1 above)
4. Deploy to Vercel free tier
5. Test endpoints manually with curl
6. Monitor QStash dashboard for execution logs

---

**Questions?** Check the logs, test locally, or adjust configurations as needed!
