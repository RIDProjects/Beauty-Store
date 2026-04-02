"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Railway provides DATABASE_URL or individual PG* variables
const getDbConfig = () => {
    // Try Railway's DATABASE_URL first
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL };
    }
    // Fall back to individual variables (Railway uses PG* prefix)
    return {
        host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
        database: process.env.PGDATABASE || process.env.DB_NAME || 'femstore',
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };
};
exports.pool = new pg_1.Pool(getDbConfig());
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
const query = async (text, params) => {
    const start = Date.now();
    const res = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
};
exports.query = query;
const getClient = () => exports.pool.connect();
exports.getClient = getClient;
//# sourceMappingURL=database.js.map