// Script para configurar el schema de la base de datos PostgreSQL
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { pool, checkConnection } = require('./database');

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

/**
 * Lee el archivo schema.sql
 */
async function readSchemaFile() {
  try {
    const schema = await fs.readFile(SCHEMA_FILE, 'utf-8');
    return schema;
  } catch (error) {
    console.error('❌ Error leyendo schema.sql:', error);
    throw error;
  }
}

/**
 * Ejecuta el schema SQL
 */
async function executeSchema(schema) {
  const client = await pool.connect();

  try {
    console.log('🔄 Ejecutando schema SQL...\n');

    // Ejecutar el schema completo
    await client.query(schema);

    console.log('✅ Schema ejecutado exitosamente\n');

    // Verificar tablas creadas
    const tableCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const result = await client.query(tableCheckQuery);

    console.log('📊 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log();

    // Verificar funciones creadas
    const functionCheckQuery = `
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `;

    const funcResult = await client.query(functionCheckQuery);

    console.log('⚙️  Funciones creadas:');
    funcResult.rows.forEach(row => {
      console.log(`  ✓ ${row.routine_name}()`);
    });

    console.log();

  } catch (error) {
    console.error('❌ Error ejecutando schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Función principal
 */
async function setupDatabase() {
  console.log('\n🚀 ============================================');
  console.log('🗄️  Setup de Base de Datos PostgreSQL');
  console.log('🚀 ============================================\n');

  try {
    // 1. Verificar conexión
    console.log('📡 Verificando conexión a PostgreSQL...');

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurado en .env');
      console.error('💡 Agrega DATABASE_URL a tu archivo .env');
      console.error('   Ejemplo: DATABASE_URL=postgresql://user:password@host:5432/database\n');
      process.exit(1);
    }

    const isConnected = await checkConnection();

    if (!isConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL');
      console.error('⚠️  Verifica que DATABASE_URL sea correcto y que PostgreSQL esté corriendo\n');
      process.exit(1);
    }

    console.log('✅ Conexión a PostgreSQL exitosa\n');

    // 2. Leer schema
    console.log('📖 Leyendo archivo schema.sql...');
    const schema = await readSchemaFile();
    console.log('✅ Schema cargado\n');

    // 3. Preguntar confirmación (en producción, quitar esto o usar flag)
    console.log('⚠️  ADVERTENCIA: Esto eliminará todas las tablas existentes y las recreará');
    console.log('💡 Asegúrate de hacer backup de tus datos antes de continuar\n');

    // Para Railway o CI/CD, skip la confirmación con variable de entorno
    if (!process.env.SKIP_CONFIRMATION && process.stdin.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('¿Continuar? (y/n): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Setup cancelado por el usuario\n');
        process.exit(0);
      }

      console.log();
    } else {
      console.log('ℹ️  Modo automático activado (SKIP_CONFIRMATION o no-TTY)\n');
    }

    // 4. Ejecutar schema
    await executeSchema(schema);

    // 5. Éxito
    console.log('🎉 ============================================');
    console.log('✅ Base de datos configurada exitosamente!');
    console.log('🎉 ============================================\n');

    console.log('📝 Próximos pasos:');
    console.log('   1. Si tienes datos en orders.json, ejecuta: npm run migrate');
    console.log('   2. Inicia el servidor: npm start\n');

  } catch (error) {
    console.error('\n❌ Error configurando la base de datos:', error);
    process.exit(1);
  }

  // Cerrar pool
  await pool.end();
  process.exit(0);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
