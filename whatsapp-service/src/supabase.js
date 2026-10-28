const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function config() {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`${key} must be set`);
  }
  return {
    url: process.env.SUPABASE_URL.replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function request(path, options = {}) {
  const { url, key } = config();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  const body = await response.text();
  return body ? JSON.parse(body) : [];
}

/* ================= USERS ================= */

export async function getUserByPhone(phone) {
  const rows = await request(
    `users?phone_number=eq.${encodeURIComponent(phone)}&select=*`
  );
  return rows[0] ?? null;
}

export async function ensureUser(phone) {
  const existing = await getUserByPhone(phone);
  if (existing) return existing;

  const rows = await request("users", {
    method: "POST",
    body: JSON.stringify({ phone_number: phone }),
  });

  return rows[0];
}

export async function updateUserQuota(userId, used) {
  const rows = await request(`users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ free_messages_used: used }),
  });

  return rows[0];
}

/* ================= WEBSITES ================= */

export async function getLatestWebsite(userId) {
  const rows = await request(
    `websites?user_id=eq.${encodeURIComponent(
      userId
    )}&select=*&order=updated_at.desc&limit=1`
  );

  return rows[0] ?? null;
}

export async function createWebsite(data) {
  const rows = await request("websites", {
    method: "POST",
    body: JSON.stringify({
      user_id: data.userId,
      site_name: data.siteName,
      template_id: data.templateId,
      theme_color: data.themeColor,
      json_structure: data.jsonStructure || {},
    }),
  });

  return rows[0];
}

/* 🔥 أهم تعديل هنا */
export async function updateWebsite(id, data) {
  // 🧠 1. نجيب البيانات القديمة أولاً
  const existingRows = await request(
    `websites?id=eq.${encodeURIComponent(id)}&select=*`
  );

  const existing = existingRows[0];

  if (!existing) {
    throw new Error("Website not found");
  }

  // 🛡️ 2. حماية: دمج JSON بدل الاستبدال
  const safeJson = {
    ...(existing.json_structure || {}),
    ...(data.jsonStructure || {}),
  };

  const rows = await request(
    `websites?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        site_name: data.siteName ?? existing.site_name,
        template_id: data.templateId ?? existing.template_id,
        theme_color: data.themeColor ?? existing.theme_color,
        json_structure: safeJson,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  return rows[0];
}

/* ================= API KEYS ================= */

export async function getActiveApiKeys() {
  return request(
    "api_keys?provider=eq.gemini&status=eq.active&select=id,key_string,status&order=id.asc"
  );
}

export async function markApiKeyUsed(id) {
  await request(`api_keys?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      last_used_at: new Date().toISOString(),
    }),
  });
}

/* ================= SETTINGS ================= */

export async function getSettings() {
  const rows = await request("platform_settings?select=key,value");

  return Object.fromEntries(
    rows.map((row) => [row.key, row.value])
  );
}
