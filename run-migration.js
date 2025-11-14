// Script para ejecutar migraciones de base de datos
// Uso: node run-migration.js migrations/001_add_stripe_columns.sql

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function runMigration(migrationFile) {
  try {
    console.log('\n🔄 ========================================');
    console.log('📦 EJECUTANDO MIGRACIÓN');
    console.log('🔄 ========================================\n');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Error: Archivo de migración no encontrado: ${migrationPath}`);
      process.exit(1);
    }

    console.log(`📄 Archivo: ${migrationFile}`);
    console.log(`📍 Ruta: ${migrationPath}\n`);

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔗 Conectando a la base de datos...');

    // Verificar conexión
    const connectionTest = await pool.query('SELECT NOW()');
    console.log(`✅ Conectado a PostgreSQL (${connectionTest.rows[0].now})\n`);

    console.log('🚀 Ejecutando migración...\n');
    console.log('─────────────────────────────────────────\n');

    // Ejecutar el SQL
    const result = await pool.query(sqlContent);

    console.log('─────────────────────────────────────────\n');

    // Mostrar resultados si hay
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Resultado:\n');
      console.table(result.rows);
    }

    console.log('\n✅ ========================================');
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('✅ ========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERROR EJECUTANDO MIGRACIÓN');
    console.error('❌ ========================================\n');
    console.error('Error:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

// Verificar que se proporcionó un archivo
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Debes proporcionar un archivo de migración\n');
  console.log('Uso: node run-migration.js migrations/001_add_stripe_columns.sql\n');
  console.log('Migraciones disponibles:');

  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(f => console.log(`  - migrations/${f}`));
  } else {
    console.log('  (No hay carpeta de migraciones)');
  }

  process.exit(1);
}

runMigration(migrationFile);
