ALTER TABLE users
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN gender VARCHAR(50),
  ADD COLUMN nationality VARCHAR(100),
  ADD COLUMN preferred_language VARCHAR(5),
  ADD COLUMN timezone VARCHAR(100),
  ADD COLUMN bio VARCHAR(250);

CREATE TABLE member_profile_photos (
  user_id UUID PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL,
  data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT member_profile_photos_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
