export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FRONTEND_URL: string;
  SESSION_SECRET: string;
  ADMIN_PASSWORD: string;
  META_WHATSAPP_TOKEN: string;
  META_PHONE_NUMBER_ID: string;
  META_VERIFY_TOKEN: string;
  META_APP_SECRET: string;
  META_GRAPH_VERSION?: string;
  GEMINI_MODEL?: string;
  WHATSAPP_QUEUE?: Queue<QueueMessage>;
  MANFAZ_RATE_LIMIT?: KVNamespace;
}

export interface IncomingMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: { button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string } };
  image?: { id?: string; mime_type?: string };
}

export interface QueueMessage {
  message: IncomingMessage;
}

export interface PendingImage {
  url: string;
  receivedAt: string;
}

export interface UserRow {
  id: string;
  phone_number: string;
  free_messages_used: number;
  free_messages_limit: number;
  pending_build_request: string | null;
  pending_image_url: string | null;
  pending_image_new_key: string | null;
  // Extra images that arrived while one was already waiting on a placement
  // choice. Empty for the common single-image case — see message-handler's
  // handleImageMessage / handleBatchPlacementText for how this fills up.
  pending_images: PendingImage[];
  // Step-by-step flow state (add item / edit item) — see
  // migrations/015_pending_flow.sql and message-handler's advanceFlow().
  pending_flow: string | null;
  pending_flow_data: Record<string, unknown>;
  blocked: boolean;
  created_at: string;
}

export interface WebsiteRow {
  id: string;
  user_id: string;
  public_id: string;
  username: string;
  site_name: string;
  template_id: string;
  theme_color: string;
  json_structure: Record<string, unknown>;
  show_branding: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRow {
  id: string;
  provider: string;
  key_string: string;
  status: "active" | "disabled";
  last_used_at: string | null;
}

export interface PlatformSettingRow {
  id?: string;
  key: string;
  value: string;
}

export interface ConversationMessageRow {
  id: number;
  user_id: string;
  direction: "inbound" | "outbound";
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}