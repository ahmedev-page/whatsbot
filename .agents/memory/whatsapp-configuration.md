---
name: WhatsApp configuration
description: Durable rules for configuring the official Meta WhatsApp Cloud API connection.
---

Use `META_VERIFY_TOKEN` for webhook verification and keep `META_APP_SECRET` mandatory so unsigned webhook requests are rejected. The production runtime is the Cloudflare Worker, which also needs the Meta phone number ID as a non-secret environment variable.

**Why:** The Replit integration provides authenticated in-environment access, while the independently deployable Worker needs explicit environment configuration; inconsistent names can silently prevent webhook verification.

**How to apply:** When changing WhatsApp configuration or deployment templates, preserve these names or support an explicit backwards-compatible alias and keep signature validation fail-closed.