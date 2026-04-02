import { Pool } from 'pg';

const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    return { connectionString };
  }
  
  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
};

// Create pool lazily to handle serverless environment
let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool(getDbConfig());
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

export const query = async (text: string, params?: unknown[]) => {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
  }
  
  return res;
};

export const getClient = async () => {
  const pool = getPool();
  return pool.connect();
};

export default { query, getClient };