// PostgreSQL database connection and pool management
require('dotenv').config();
const { Pool } = require('pg');

// Configuración del pool de conexiones
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
  max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Crear pool de conexiones
const pool = new Pool(poolConfig);

// Event listeners para el pool
pool.on('connect', () => {
  console.log('✅ Nueva conexión PostgreSQL establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de PostgreSQL:', err);
});

pool.on('remove', () => {
  console.log('🔌 Conexión PostgreSQL removida del pool');
});

/**
 * Ejecuta una query con manejo de errores y retry logic
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @param {number} retries - Number of retries (default: 3)
 * @returns {object} Query result
 */
async function query(text, params = [], retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn(`⚠️  Query lenta (${duration}ms):`, text.substring(0, 100));
      }

      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Error en query (intento ${attempt}/${retries}):`, error.message);

      // Si es el último intento o el error no es recuperable, lanzar
      if (attempt === retries || !isRetryableError(error)) {
        throw error;
      }

      // Esperar antes de reintentar (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 100;
      console.log(`⏳ Reintentando en ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Determina si un error es recuperable y vale la pena reintentar
 * @param {Error} error - Error object
 * @returns {boolean} True si es recuperable
 */
function isRetryableError(error) {
  // Errores de conexión temporales
  const retryableCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '57P03', // cannot_connect_now
    '53300', // too_many_connections
  ];

  return retryableCodes.some(code =>
    error.code === code || error.message.includes(code)
  );
}

/**
 * Obtiene un cliente del pool para transacciones
 * @returns {object} Database client
 */
async function getClient() {
  try {
    const client = await pool.connect();
    console.log('🔗 Cliente PostgreSQL obtenido del pool');
    return client;
  } catch (error) {
    console.error('❌ Error obteniendo cliente del pool:', error);
    throw error;
  }
}

/**
 * Ejecuta una transacción con rollback automático en caso de error
 * @param {function} callback - Función async que recibe el cliente
 * @returns {*} Resultado del callback
 */
async function transaction(callback) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    console.log('🔄 Transacción iniciada');

    const result = await callback(client);

    await client.query('COMMIT');
    console.log('✅ Transacción completada');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🔙 Transacción revertida:', error.message);
    throw error;
  } finally {
    client.release();
    console.log('🔓 Cliente liberado al pool');
  }
}

/**
 * Verifica la conexión a la base de datos
 * @returns {boolean} True si la conexión es exitosa
 */
async function checkConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as db');
    console.log(`✅ Conexión a PostgreSQL OK - DB: ${result.rows[0].db}, Time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión a PostgreSQL:', error.message);
    return false;
  }
}

/**
 * Obtiene estadísticas del pool de conexiones
 * @returns {object} Pool stats
 */
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Cierra todas las conexiones del pool (para shutdown graceful)
 */
async function closePool() {
  try {
    await pool.end();
    console.log('🔌 Pool de PostgreSQL cerrado correctamente');
  } catch (error) {
    console.error('❌ Error cerrando pool de PostgreSQL:', error);
    throw error;
  }
}

// Manejo de shutdown graceful
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM recibido, cerrando pool de PostgreSQL...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT recibido, cerrando pool de PostgreSQL...');
  await closePool();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  transaction,
  checkConnection,
  getPoolStats,
  closePool,
  pool
};
