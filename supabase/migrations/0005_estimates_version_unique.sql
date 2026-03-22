-- Prevent duplicate version numbers from concurrent runEstimate calls
ALTER TABLE estimates ADD CONSTRAINT estimates_conversation_version_unique
  UNIQUE (conversation_id, version);
