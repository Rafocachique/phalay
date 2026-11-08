-- Ejecutar una vez en Supabase SQL Editor antes del despliegue que incluye
-- el Libro de Reclamaciones y datos legales públicos.
ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "legal_name" TEXT,
  ADD COLUMN IF NOT EXISTS "business_ruc" TEXT,
  ADD COLUMN IF NOT EXISTS "business_address" TEXT;

CREATE TABLE IF NOT EXISTS "consumer_claims" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_number" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "document_number" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "is_minor" BOOLEAN NOT NULL DEFAULT FALSE,
  "guardian_name" TEXT,
  "product_or_service" TEXT NOT NULL,
  "amount" DECIMAL(12,2),
  "order_number" TEXT,
  "detail" TEXT NOT NULL,
  "request" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "response" TEXT,
  "responded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "consumer_claims_status_idx" ON "consumer_claims"("status");
CREATE INDEX IF NOT EXISTS "consumer_claims_created_at_idx" ON "consumer_claims"("created_at");
