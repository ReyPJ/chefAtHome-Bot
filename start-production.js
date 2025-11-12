// Script de inicio para producción con auto-setup de base de datos
// Este script verifica y crea las tablas automáticamente antes de iniciar el servidor

require('dotenv').config();
const { checkConnection, query } = require('./database');
const fs = require('fs').promises;
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

/**
 * Verifica si las tablas principales existen
 */
async function checkTablesExist() {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'addresses', 'orders');
    `);

    const count = parseInt(result.rows[0].count);
    return count === 3; // Las 3 tablas deben existir
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
    return false;
  }
}

/**
 * Ejecuta el setup de la base de datos automáticamente
 */
async function setupDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');

    // Leer y ejecutar el schema
    const schema = await fs.readFile(SCHEMA_FILE, 'utf-8');
    await query(schema);

    console.log('✅ Base de datos inicializada correctamente');

    // Verificar tablas creadas
    const tableCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 Tablas creadas:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Error en setup de base de datos:', error);
    throw error;
  }
}

/**
 * Función principal de inicio
 */
async function start() {
  console.log('\n🚀 ============================================');
  console.log('🤖 ChefAtHome WhatsApp Bot - Iniciando...');
  console.log('🚀 ============================================\n');

  try {
    // 1. Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL no está configurado');
      console.error('💡 Asegúrate de tener PostgreSQL configurado en Railway\n');
      process.exit(1);
    }

    console.log('📡 Verificando conexión a PostgreSQL...');

    // 2. Verificar conexión a la base de datos
    const isConnected = await checkConnection();

    if (!isConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL');
      console.error('⚠️  Verifica que DATABASE_URL sea correcto\n');
      process.exit(1);
    }

    console.log('✅ Conexión a PostgreSQL exitosa\n');

    // 3. Verificar si las tablas existen
    console.log('🔍 Verificando esquema de base de datos...');
    const tablesExist = await checkTablesExist();

    if (!tablesExist) {
      console.log('⚠️  Tablas no encontradas - Ejecutando setup automático...\n');
      await setupDatabase();
      console.log('\n✅ Setup de base de datos completado\n');
    } else {
      console.log('✅ Esquema de base de datos OK\n');
    }

    // 4. Iniciar el servidor
    console.log('🚀 Iniciando servidor Express...\n');
    require('./server');

  } catch (error) {
    console.error('\n❌ Error fatal al iniciar:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar inicio
start();
