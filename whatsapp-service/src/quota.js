import { updateUserQuota } from "./supabase.js";

export function remainingMessages(user) {
  return Math.max(0, Number(user.free_messages_limit) - Number(user.free_messages_used));
}

export async function consumeMessage(user) {
  const remaining = remainingMessages(user);
  if (remaining <= 0) return { allowed: false, user };
  const updated = await updateUserQuota(user.id, Number(user.free_messages_used) + 1);
  return { allowed: true, user: updated };
}