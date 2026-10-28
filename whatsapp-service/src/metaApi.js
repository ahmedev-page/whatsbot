const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";

function getConfig() {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID must be set");
  }
  return { token, phoneNumberId };
}

export async function sendTextMessage(to, body) {
  const { token, phoneNumberId } = getConfig();
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
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
    const text = await response.text();
    throw new Error(`Meta API failed (${response.status}): ${text}`);
  }
  return response.json();
}

export async function markMessageRead(messageId) {
  const { token, phoneNumberId } = getConfig();
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    },
  );
  if (!response.ok) return null;
  return response.json();
}