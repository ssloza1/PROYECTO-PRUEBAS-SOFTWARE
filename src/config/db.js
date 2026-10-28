require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Conexión preferente mediante DATABASE_URL o variables individuales
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: isTest ? 2 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'aws-0-us-east-1.pooler.supabase.com',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres.kmahrxgfqplzggsjkwwo',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: isTest ? 2 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
});

/**
 * Ejecuta una consulta SQL en la base de datos
 * @param {string} text - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (!isTest && duration > 500) {
    console.warn(`[DB Slow Query] ${duration}ms: ${text}`);
  }
  return res;
}

/**
 * Obtiene un cliente para transacciones
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Cierra el pool de conexiones (usado en tests y cierre de servidor)
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  getClient,
  closePool,
};
