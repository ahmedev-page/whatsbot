# WhatsApp service status

The production deployment uses the ORxai Cloudflare Worker in `workers/manfaz-api`.
It serves the REST API, admin dashboard API, Meta WhatsApp webhook, Gemini
message processing, and queue consumer from one Worker. The files in this
directory are kept as a standalone export fallback and should not be deployed
alongside the Worker.