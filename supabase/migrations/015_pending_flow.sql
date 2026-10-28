-- Adds a small state machine to the users table for step-by-step WhatsApp
-- flows (add item / edit item), so the bot can walk someone through
-- "الاسم؟ → السعر؟ → الصورة؟ → تأكيد؟" without a Gemini call at every step.
--
-- pending_flow: current step id, e.g. 'add_item_name', 'add_item_price',
--   'add_item_image', 'confirm_add_item' (and the 'edit_item_*' equivalents).
--   NULL when the user isn't in a step-by-step flow.
-- pending_flow_data: small jsonb draft being built across the steps
--   (collection key, name, price, image url, and — for edits — the index of
--   the item being edited). Cleared back to '{}' once the flow ends.
alter table users
  add column if not exists pending_flow text,
  add column if not exists pending_flow_data jsonb not null default '{}'::jsonb;
