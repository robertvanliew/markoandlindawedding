-- Guests find their invitation with their last name and the last 4 digits of their phone number.
-- Only those 4 digits are stored, never the full number.
alter table invites add column if not exists phone_last4 text check (phone_last4 ~ '^[0-9]{4}$');
