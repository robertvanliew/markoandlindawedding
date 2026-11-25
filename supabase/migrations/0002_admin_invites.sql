-- Admin dashboard: track when each invitation email was sent; look parties up by email.
alter table invites add column if not exists invited_at timestamptz;
create index if not exists invites_email_lower on invites (lower(email));
create index if not exists response_guests_response on response_guests (response_id);
