import { Pool } from 'pg';

const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    // Forzar IPv4 y agregar opciones de conexión
    return { 
      connectionString,
      ssl: { rejectUnauthorized: false }
    };
  }
  
  return {
    host: process.env.PGHOST || process.env.DATABASE_HOST,
    port: Number(process.env.PGPORT || process.env.DATABASE_PORT) || 5432,
    database: process.env.PGDATABASE || process.env.DATABASE,
    user: process.env.PGUSER || process.env.DATABASE_USER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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