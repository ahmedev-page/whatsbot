# ORxai Cloudflare Worker

This is the production API for ORxai on Cloudflare Workers. It serves the
REST API, admin endpoints, Meta WhatsApp webhook, Gemini processing, and the
WhatsApp Queue consumer from one Worker.

Required secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
FRONTEND_URL
SESSION_SECRET
ADMIN_PASSWORD
META_WHATSAPP_TOKEN
META_PHONE_NUMBER_ID
META_VERIFY_TOKEN
META_APP_SECRET
```

Deploy from the repository root with:

```bash
pnpm --filter @workspace/manfaz-api-worker run deploy
```

Create the queue once before deployment:

```bash
pnpm exec wrangler queues create manfaz-whatsapp-messages
```