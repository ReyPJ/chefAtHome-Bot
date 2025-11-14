# 🔄 Instrucciones de Migración - Stripe Columns

## ⚠️ Problema
La base de datos en Railway no tiene las columnas nuevas de Stripe porque ya existían las tablas antes del deploy.

Error: `column "stripe_payment_link_id" of relation "orders" does not exist`

## ✅ Solución

Tienes **3 opciones** para migrar la base de datos:

---

## 🚀 OPCIÓN 1: Ejecutar desde Railway CLI (MÁS RÁPIDO)

### Paso 1: Instalar Railway CLI (si no lo tienes)
```bash
npm install -g @railway/cli
```

### Paso 2: Login a Railway
```bash
railway login
```

### Paso 3: Conectarte a tu proyecto
```bash
railway link
# Selecciona tu proyecto
```

### Paso 4: Ejecutar la migración
```bash
railway run node run-migration.js migrations/001_add_stripe_columns.sql
```

Deberías ver:
```
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
```

---

## 📝 OPCIÓN 2: Ejecutar SQL Directamente en Railway Console

### Paso 1: Conectarte a PostgreSQL
```bash
railway connect postgres
```

### Paso 2: Copiar y pegar este SQL:

```sql
-- Crear ENUM para payment_status si no existe
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_link_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Verificar
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('stripe_payment_link_id', 'stripe_session_id', 'payment_status', 'payment_completed_at');
```

Deberías ver las 4 columnas listadas.

### Paso 3: Salir
```sql
\q
```

---

## 🌐 OPCIÓN 3: Ejecutar desde Railway Dashboard

### Paso 1: Ir a Railway Dashboard
1. Ve a https://railway.app/
2. Selecciona tu proyecto
3. Selecciona el servicio PostgreSQL (no el Node.js app)

### Paso 2: Abrir Query Tab
1. Haz clic en "Data" o "Query"
2. Se abrirá un editor SQL

### Paso 3: Copiar y ejecutar el SQL

Copia el mismo SQL de la Opción 2 y ejecútalo.

---

## 🔍 Verificación Post-Migración

Después de ejecutar la migración, verifica que funcionó:

### 1. Verificar columnas en la base de datos
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

Deberías ver las nuevas columnas:
- `stripe_payment_link_id` - character varying(255)
- `stripe_session_id` - character varying(255)
- `payment_status` - USER-DEFINED (payment_status_enum)
- `payment_completed_at` - timestamp without time zone

### 2. Probar una orden nueva en WhatsApp

Haz una orden completa y verifica que:
- ✅ Recibes el payment link por WhatsApp
- ✅ No hay errores en los logs de Railway
- ✅ El pago se procesa correctamente

### 3. Verificar en logs de Railway

```bash
railway logs
```

Deberías ver:
```
✅ Payment Link creado: https://buy.stripe.com/test_...
✅ Payment Link ID guardado en la base de datos
✅ Payment Link enviado a WhatsApp: 506...
```

---

## 🐛 Troubleshooting

### Error: "permission denied to create extension"
**Solución:** Railway ya tiene los permisos correctos, pero si ves este error, usa `DO $$ BEGIN ... EXCEPTION ... END $$;` como en el SQL proporcionado.

### Error: "type payment_status_enum already exists"
**Solución:** El SQL usa `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ...` para evitar este error. Si aún así falla, primero ejecuta:
```sql
DROP TYPE IF EXISTS payment_status_enum CASCADE;
```

### Error: "column already exists"
**Solución:** El SQL usa `ADD COLUMN IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces.

---

## 📊 Verificar Datos Existentes

Si ya tienes órdenes en la base de datos, las nuevas columnas tendrán valores por defecto:
- `stripe_payment_link_id`: `NULL`
- `stripe_session_id`: `NULL`
- `payment_status`: `'pending'`
- `payment_completed_at`: `NULL`

Esto es correcto y no afectará el funcionamiento del sistema. Las nuevas órdenes sí tendrán estos valores poblados.

---

## ✅ Checklist Post-Migración

```
□ Ejecuté la migración sin errores
□ Verifiqué que las 4 columnas existen en la tabla orders
□ Los logs de Railway no muestran errores
□ Hice una orden de prueba y recibí el payment link
□ El payment link funciona correctamente
□ El webhook de Stripe está configurado
□ La notificación de pago llega por WhatsApp
```

---

## 🚀 Siguiente Paso

Una vez completada la migración, continúa con los pasos de testing de la guía anterior.
