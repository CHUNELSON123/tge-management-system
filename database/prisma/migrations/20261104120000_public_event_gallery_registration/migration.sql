ALTER TABLE event_media
  ADD COLUMN alt_text TEXT,
  ADD COLUMN public_url VARCHAR(2000),
  ADD COLUMN approved_at TIMESTAMPTZ(6);

ALTER TABLE event_registrations
  ADD COLUMN consent_accepted_at TIMESTAMPTZ(6),
  ADD COLUMN consent_version VARCHAR(50);

CREATE UNIQUE INDEX event_registrations_event_guest_email_active_idx
  ON event_registrations (event_id, lower(guest_email))
  WHERE cancelled_at IS NULL AND guest_email IS NOT NULL;
