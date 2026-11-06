-- Ejecutar una sola vez antes del despliegue. No elimina ni modifica pagos.
-- Si existen identificadores duplicados, falla: revisarlos antes de continuar.
CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_transaction_id_key
ON payments (gateway_transaction_id);
