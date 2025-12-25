# Next Steps - QStash Cron Setup

## Immediate Tasks

### 1. Test Cron Endpoints Locally
```bash
# Start dev server
bun run dev

# In another terminal, test endpoints
./scripts/test-cron.sh
```

**Expected output:**
- ✅ AI price check endpoint returns 200
- ✅ Weekly reminder endpoint returns 200
- ✅ Auth test fails with 401 (proves security works)

---

### 2. Deploy to Production
Deploy your app to your hosting platform (Vercel, Railway, etc.) and get your production URL.

---

### 3. Update Production URL in Setup Script

Edit `scripts/setup-qstash.sh` line 13:
```bash
NEXT_PUBLIC_APP_URL="https://your-actual-production-url.com"
```

---

### 4. Run QStash Setup
```bash
./scripts/setup-qstash.sh
```

This creates two schedules in QStash:
- **Daily AI Price Check**: 2 AM UTC
- **Weekly Reminders**: Sunday 9 AM UTC

**Expected output:**
```
✅ Created! Schedule ID: sched_xxxxx
✅ Created! Schedule ID: sched_xxxxx
```

---

### 5. Verify in QStash Dashboard
1. Visit https://console.upstash.com/qstash
2. Check "Schedules" tab
3. Verify both schedules are created:
   - `/api/cron/check-prices-ai` (0 2 * * *)
   - `/api/cron/weekly-reminders` (0 9 * * 0)

---

### 6. Monitor First Execution
Wait for the next scheduled run or trigger manually via QStash dashboard.

**Check logs for:**
- Successful price checks
- Email alerts sent (if any price drops)
- Weekly reminders sent to users

---

## Security Cleanup (Important!)

### Remove Hardcoded Secrets from Scripts

The scripts currently have hardcoded credentials (temporary for setup). After QStash is configured, you should:

**Option A: Revert to environment variables**
```bash
# In scripts/setup-qstash.sh and scripts/test-cron.sh
# Replace hardcoded values with:
QSTASH_TOKEN="${QSTASH_TOKEN}"
CRON_SECRET="${CRON_SECRET}"
# etc.
```

**Option B: Delete scripts after setup**
```bash
# If you don't need them anymore
rm scripts/setup-qstash.sh
rm scripts/test-cron.sh
```

⚠️ **Never commit hardcoded secrets to public repositories!**

---

## Production Checklist

- [ ] Test endpoints locally with `./scripts/test-cron.sh`
- [ ] Deploy app to production
- [ ] Update production URL in `setup-qstash.sh`
- [ ] Run `./scripts/setup-qstash.sh`
- [ ] Verify schedules in QStash dashboard
- [ ] Test manual trigger from QStash dashboard
- [ ] Monitor first automated run
- [ ] Check email delivery (price alerts and reminders)
- [ ] Remove hardcoded secrets from scripts
- [ ] Update `.env.example` with production values format
- [ ] Generate production `CRON_SECRET`: `openssl rand -base64 32`

---

## Testing Price Drops

To test price drop alerts:

1. **Add a gift with URL and target price**
2. **Wait for AI price check** (or manually trigger via QStash)
3. **If price < target**, email alert should be sent
4. **Check Resend dashboard** for email delivery status

---

## Troubleshooting

### QStash Setup Fails
- Check QSTASH_TOKEN is valid
- Verify production URL is publicly accessible
- Check QStash quota (100 free requests/day)

### Endpoints Return 401
- Verify CRON_SECRET matches in:
  - `.env` file
  - QStash schedule headers
  - Scripts (if hardcoded)

### No Emails Sent
- Check RESEND_API_KEY is valid
- Verify domain is configured in Resend
- Check recipient email addresses exist in profiles
- Review logs for email sending errors

### Price Checks Not Working
- Verify GEMINI_API_KEY is valid
- Check API quota limits
- Review logs for extraction errors
- Test `extractProductMetadata()` manually

---

## Cost Monitoring

### QStash
- **Free tier**: 100 requests/day
- **With 2 daily crons**: ~2 requests/day = well within free tier
- **Upgrade**: $0.10/1K requests if needed

### Gemini API
- **Current setup**: Max 100 products/day
- **Estimated cost**: ~$0.06-0.30/day depending on usage
- **Monthly**: ~$2-10/month for small user base

Monitor usage at:
- https://console.upstash.com/qstash (QStash)
- https://aistudio.google.com/app/apikey (Gemini)

---

## Future Improvements

- [ ] Add user preferences for email frequency
- [ ] Implement price drop threshold settings
- [ ] Add price chart visualization
- [ ] Create daily summary emails (batch alerts)
- [ ] Add webhook for instant price notifications
- [ ] Implement caching for frequently checked products
- [ ] Add retry logic for failed price checks
- [ ] Create admin dashboard for monitoring cron jobs
