import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { handleIncomingMessage } from "./messageHandler.js";

const router = Router();
const processedMessages = new Set();

function signatureIsValid(rawBody, signature) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = signature.slice("sha256=".length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const expectedToken = process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && token === expectedToken) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  const rawBody = req.rawBody;
  if (!rawBody || !signatureIsValid(rawBody, req.headers["x-hub-signature-256"])) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200);

  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (!message.id || processedMessages.has(message.id)) continue;
        processedMessages.add(message.id);
        if (processedMessages.size > 5000) processedMessages.delete(processedMessages.values().next().value);
        await handleIncomingMessage(message).catch(() => null);
      }
    }
  }
});

export default router;