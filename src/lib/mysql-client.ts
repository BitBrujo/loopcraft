import mysql from 'mysql2/promise';

// MySQL connection configuration
// IMPORTANT: All environment variables are REQUIRED - no fallback values
// Validation happens at runtime when pool is created
function getConfig() {
  // Validate required environment variables
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_DATABASE || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_PORT) {
    throw new Error('Missing required MySQL environment variables: MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD must all be set');
  }

  return {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
}

// Create connection pool
let pool: mysql.Pool | null = null;

/**
 * Get MySQL connection pool instance
 * Creates pool on first call, returns cached instance on subsequent calls
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getConfig();
    pool = mysql.createPool(config);
    console.log('MySQL connection pool created');
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query results
 */
export async function query<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  const pool = getPool();
  const [results] = await pool.execute(query, params);
  return results as T;
}

/**
 * Execute a query that returns a single row
 * @param query SQL query string
 * @param params Query parameters
 * @returns Single row or null
 */
export async function queryOne<T = any>(
  query: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T[]>(query, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Begin a transaction
 * Returns connection that must be manually released
 */
export async function beginTransaction(): Promise<mysql.PoolConnection> {
  const pool = getPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit a transaction
 * @param connection Connection from beginTransaction()
 */
export async function commitTransaction(
  connection: mysql.PoolConnection
): Promise<void> {
  await connection.commit();
  connection.release();
}

/**
 * Rollback a transaction
 * @param connection Connection from beginTransaction()
 */
export async function rollbackTransaction(
  connection: mysql.PoolConnection
): Promise<void> {
  await connection.rollback();
  connection.release();
}

/**
 * Check database connection health
 * @returns true if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('MySQL connection check failed:', error);
    return false;
  }
}

/**
 * Close all connections in the pool
 * Should be called on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL connection pool closed');
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}

export default {
  getPool,
  query,
  queryOne,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  checkConnection,
  closePool,
};