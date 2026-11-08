-- Ejecutar una sola vez antes del despliegue. No elimina ni modifica pedidos.
-- Si existen identificadores duplicados, falla: revísalos antes de continuar.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_idempotency_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_idempotency_key_key
ON orders (checkout_idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_transaction_id_key
ON payments (gateway_transaction_id);
