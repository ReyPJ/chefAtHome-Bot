-- Migración: Agregar columnas de Stripe a la tabla orders
-- Fecha: 2025-11-14
-- Descripción: Agrega columnas necesarias para la integración con Stripe

-- Crear ENUM para payment_status si no existe
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columna stripe_payment_link_id
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_payment_link_id VARCHAR(255);

-- Agregar columna stripe_session_id
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- Agregar columna payment_status
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending';

-- Agregar columna payment_completed_at
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Agregar comentarios a las columnas
COMMENT ON COLUMN orders.stripe_payment_link_id IS 'ID del Payment Link generado en Stripe';
COMMENT ON COLUMN orders.stripe_session_id IS 'ID de la sesión de checkout de Stripe para tracking de pagos';
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago: pending (pendiente), completed (completado), failed (fallido)';
COMMENT ON COLUMN orders.payment_completed_at IS 'Timestamp de cuando se completó el pago exitosamente';

-- Verificar que las columnas se crearon correctamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
    AND column_name IN ('stripe_payment_link_id', 'stripe_session_id', 'payment_status', 'payment_completed_at')
ORDER BY column_name;

-- Mostrar mensaje de éxito
SELECT '✅ Migración 001_add_stripe_columns.sql completada exitosamente' AS status;
