export function getMetaGraphVersion(): string {
  return process.env.META_GRAPH_VERSION || "v20.0";
}

// Shared by the legacy webhook route and the admin "send message" endpoint —
// one place that knows how to actually call the Meta Graph API.
export async function sendTextMessage(to: string, body: string): Promise<void> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error("Meta WhatsApp configuration is incomplete");

  const response = await fetch(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Meta send failed with status ${response.status}`);
  }
}