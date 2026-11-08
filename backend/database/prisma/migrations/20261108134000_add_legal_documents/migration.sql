ALTER TABLE "system_settings"
  ADD COLUMN "legal_privacy_content" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "legal_terms_content" TEXT NOT NULL DEFAULT '';
