ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "shipping_proof_url" TEXT,
  ADD COLUMN IF NOT EXISTS "shipping_receipt_number" TEXT;
