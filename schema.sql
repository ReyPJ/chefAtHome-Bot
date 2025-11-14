-- Schema for ChefAtHome WhatsApp Bot Database
-- PostgreSQL 12+

-- Drop tables if exist (for clean setup)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM type for order status
DROP TYPE IF EXISTS order_status_enum CASCADE;
CREATE TYPE order_status_enum AS ENUM (
  'pending_payment',
  'paid',
  'preparing',
  'in_delivery',
  'delivered',
  'cancelled'
);

-- Create ENUM type for payment status
DROP TYPE IF EXISTS payment_status_enum CASCADE;
CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'completed',
  'failed'
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_frequent_customer BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_frequent ON users(is_frequent_customer);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'Usuarios del sistema - clientes que hacen pedidos';
COMMENT ON COLUMN users.phone IS 'Número de teléfono con código de país (ej: 521234567890)';
COMMENT ON COLUMN users.is_frequent_customer IS 'Marca si el usuario ha hecho más de una orden';

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  delivery_zone INTEGER NOT NULL CHECK (delivery_zone IN (1, 2, 3)),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- Trigger para updated_at
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE addresses IS 'Direcciones de entrega de los usuarios';
COMMENT ON COLUMN addresses.delivery_zone IS 'Zona de entrega: 1 (Centro $50), 2 (Cerca $80), 3 (Lejos $120)';
COMMENT ON COLUMN addresses.is_default IS 'Dirección por defecto del usuario';

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  restaurant_id VARCHAR(50) NOT NULL,
  restaurant_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee DECIMAL(10, 2) NOT NULL CHECK (delivery_fee >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  address TEXT NOT NULL,
  delivery_zone INTEGER NOT NULL CHECK (delivery_zone IN (1, 2, 3)),
  status order_status_enum DEFAULT 'pending_payment',
  needs_human_support BOOLEAN DEFAULT false,
  human_support_reason TEXT,
  human_support_requested_at TIMESTAMP,
  stripe_payment_link_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  payment_status payment_status_enum DEFAULT 'pending',
  payment_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas y queries comunes
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_needs_human_support ON orders(needs_human_support);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Índice compuesto para queries de soporte humano
CREATE INDEX idx_orders_support_pending ON orders(needs_human_support, status)
  WHERE needs_human_support = true;

-- Trigger para updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE orders IS 'Órdenes de pedidos de comida';
COMMENT ON COLUMN orders.order_number IS 'Número único de orden (formato: ORD-timestamp)';
COMMENT ON COLUMN orders.items IS 'Array JSON de items ordenados con {id, name, price, quantity}';
COMMENT ON COLUMN orders.needs_human_support IS 'Indica si el cliente solicitó hablar con un agente humano';
COMMENT ON COLUMN orders.human_support_reason IS 'Contexto o razón por la que se solicitó soporte humano';
COMMENT ON COLUMN orders.stripe_payment_link_id IS 'ID del Payment Link generado en Stripe';
COMMENT ON COLUMN orders.stripe_session_id IS 'ID de la sesión de checkout de Stripe para tracking de pagos';
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago: pending (pendiente), completed (completado), failed (fallido)';
COMMENT ON COLUMN orders.payment_completed_at IS 'Timestamp de cuando se completó el pago exitosamente';

-- ============================================
-- FUNCIÓN: Obtener estadísticas de órdenes
-- ============================================
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE(
  total_orders BIGINT,
  pending_payment BIGINT,
  paid BIGINT,
  preparing BIGINT,
  in_delivery BIGINT,
  delivered BIGINT,
  cancelled BIGINT,
  needs_support BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending_payment')::BIGINT as pending_payment,
    COUNT(*) FILTER (WHERE status = 'paid')::BIGINT as paid,
    COUNT(*) FILTER (WHERE status = 'preparing')::BIGINT as preparing,
    COUNT(*) FILTER (WHERE status = 'in_delivery')::BIGINT as in_delivery,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as delivered,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled,
    COUNT(*) FILTER (WHERE needs_human_support = true)::BIGINT as needs_support
  FROM orders;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_order_stats() IS 'Obtiene estadísticas agregadas de todas las órdenes';

-- ============================================
-- FUNCIÓN: Marcar usuario como frecuente
-- ============================================
CREATE OR REPLACE FUNCTION mark_user_as_frequent()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario tiene más de 1 orden, marcarlo como frecuente
  UPDATE users
  SET is_frequent_customer = true
  WHERE id = NEW.user_id
    AND is_frequent_customer = false
    AND (
      SELECT COUNT(*)
      FROM orders
      WHERE user_id = NEW.user_id
        AND status IN ('paid', 'preparing', 'in_delivery', 'delivered')
    ) >= 2;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar automáticamente usuarios frecuentes
CREATE TRIGGER auto_mark_frequent_customer
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status IN ('paid', 'preparing', 'in_delivery', 'delivered'))
  EXECUTE FUNCTION mark_user_as_frequent();

COMMENT ON FUNCTION mark_user_as_frequent() IS 'Marca automáticamente usuarios como frecuentes después de 2+ órdenes completadas';

-- ============================================
-- DATOS DE EJEMPLO (opcional - comentar en producción)
-- ============================================
-- INSERT INTO users (phone, name, is_frequent_customer) VALUES
--   ('5215512345678', 'Juan Pérez', true),
--   ('5215587654321', 'María García', false);

-- INSERT INTO addresses (user_id, address, delivery_zone, is_default) VALUES
--   (1, 'Calle Reforma 123, Col. Centro, CDMX', 1, true),
--   (1, 'Av. Insurgentes Sur 456, Col. Del Valle, CDMX', 2, false);

-- ============================================
-- INFORMACIÓN DEL SCHEMA
-- ============================================
SELECT
  '✅ Schema creado exitosamente' as message,
  COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
