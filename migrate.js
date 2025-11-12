// Script de migración de orders.json a PostgreSQL
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { query, transaction, checkConnection } = require('./database');

const ORDERS_FILE = path.join(__dirname, 'orders.json');

/**
 * Lee el archivo orders.json
 */
async function readOrdersFile() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️  Archivo orders.json no encontrado');
      return [];
    }
    throw error;
  }
}

/**
 * Migra un usuario
 */
async function migrateUser(client, order) {
  const sql = `
    INSERT INTO users (phone, name, is_frequent_customer)
    VALUES ($1, $2, false)
    ON CONFLICT (phone)
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING *
  `;

  const result = await client.query(sql, [order.phone, order.userName]);
  return result.rows[0];
}

/**
 * Migra una dirección
 */
async function migrateAddress(client, userId, order) {
  // Verificar si ya existe esta dirección
  const checkSql = `
    SELECT id FROM addresses
    WHERE user_id = $1 AND address = $2
    LIMIT 1
  `;

  const existing = await client.query(checkSql, [userId, order.address]);

  if (existing.rows.length > 0) {
    console.log(`  ↳ Dirección ya existe para usuario ${userId}`);
    return existing.rows[0];
  }

  // Verificar si es la primera dirección del usuario
  const countSql = `
    SELECT COUNT(*) as count FROM addresses WHERE user_id = $1
  `;

  const countResult = await client.query(countSql, [userId]);
  const isFirstAddress = parseInt(countResult.rows[0].count) === 0;

  // Insertar nueva dirección
  const insertSql = `
    INSERT INTO addresses (user_id, address, delivery_zone, is_default)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await client.query(insertSql, [
    userId,
    order.address,
    order.deliveryZone,
    isFirstAddress
  ]);

  console.log(`  ↳ Dirección migrada para usuario ${userId}`);
  return result.rows[0];
}

/**
 * Migra una orden
 */
async function migrateOrder(client, order, userId) {
  // Verificar si la orden ya existe
  const checkSql = `
    SELECT id FROM orders WHERE order_number = $1 LIMIT 1
  `;

  const existing = await client.query(checkSql, [order.id]);

  if (existing.rows.length > 0) {
    console.log(`  ⚠️  Orden ${order.id} ya existe en la base de datos`);
    return existing.rows[0];
  }

  const insertSql = `
    INSERT INTO orders (
      order_number,
      user_id,
      phone,
      user_name,
      restaurant_id,
      restaurant_name,
      items,
      subtotal,
      delivery_fee,
      total,
      address,
      delivery_zone,
      status,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const result = await client.query(insertSql, [
    order.id,
    userId,
    order.phone,
    order.userName,
    order.restaurant.id,
    order.restaurant.name,
    JSON.stringify(order.items),
    order.subtotal,
    order.deliveryFee,
    order.total,
    order.address,
    order.deliveryZone,
    order.status || 'pending_payment',
    order.createdAt || new Date().toISOString()
  ]);

  console.log(`  ✅ Orden ${order.id} migrada exitosamente`);
  return result.rows[0];
}

/**
 * Función principal de migración
 */
async function runMigration() {
  console.log('\n🚀 ============================================');
  console.log('🔄 Iniciando migración de orders.json a PostgreSQL');
  console.log('🚀 ============================================\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('📡 Verificando conexión a PostgreSQL...');
    const isConnected = await checkConnection();

    if (!isConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL');
      console.error('⚠️  Verifica que DATABASE_URL esté configurado en .env');
      process.exit(1);
    }

    console.log('✅ Conexión a PostgreSQL exitosa\n');

    // 2. Leer archivo orders.json
    console.log('📖 Leyendo archivo orders.json...');
    const orders = await readOrdersFile();

    if (orders.length === 0) {
      console.log('⚠️  No hay órdenes para migrar');
      return;
    }

    console.log(`✅ ${orders.length} órdenes encontradas\n`);

    // 3. Migrar cada orden
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`\n📦 Procesando orden ${i + 1}/${orders.length}: ${order.id}`);

      try {
        await transaction(async (client) => {
          // Migrar usuario
          console.log(`  👤 Migrando usuario: ${order.userName} (${order.phone})`);
          const user = await migrateUser(client, order);

          // Migrar dirección
          console.log(`  📍 Migrando dirección`);
          await migrateAddress(client, user.id, order);

          // Migrar orden
          console.log(`  📝 Migrando orden`);
          const migratedOrder = await migrateOrder(client, order, user.id);

          if (migratedOrder) {
            migratedCount++;
          } else {
            skippedCount++;
          }
        });
      } catch (error) {
        console.error(`  ❌ Error migrando orden ${order.id}:`, error.message);
        errorCount++;
      }
    }

    // 4. Resumen final
    console.log('\n🎉 ============================================');
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('🎉 ============================================');
    console.log(`✅ Órdenes migradas: ${migratedCount}`);
    console.log(`⏭️  Órdenes saltadas (ya existían): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total procesadas: ${orders.length}`);
    console.log('============================================\n');

    if (errorCount === 0) {
      console.log('✅ Migración completada exitosamente! 🎉\n');

      // Sugerir hacer backup del archivo JSON
      console.log('💡 Sugerencia: Haz un backup de orders.json antes de eliminarlo');
      console.log('   cp orders.json orders.json.backup\n');
    } else {
      console.log('⚠️  Migración completada con errores. Revisa los logs arriba.\n');
    }

  } catch (error) {
    console.error('\n❌ Error fatal durante la migración:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar migración si se ejecuta directamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
