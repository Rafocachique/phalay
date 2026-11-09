-- Conserva la dirección principal para autocompletar el próximo checkout.
-- IF NOT EXISTS permite aplicar el cambio en instalaciones que ya recibieron
-- esta columna mediante prisma db push.
ALTER TABLE "shipping_addresses"
  ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "shipping_addresses_user_id_is_default_idx"
  ON "shipping_addresses"("user_id", "is_default");
