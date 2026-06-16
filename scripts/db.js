// ============================================================
// Shared DB configuration — all credentials come from env vars
// ============================================================
// Usage: import getPool from './db.js'
//        const pool = getPool()
// Environment variables:
//   SUPABASE_DB_URL     — full connection string (preferred)
//   DB_HOST             — database host (required if no URL)
//   SUPABASE_DB_PASSWORD— database password (required if no URL)
//   DB_PORT             — database port (default: 5432)
// ============================================================
//
// NOTE: The shared Supabase project ref is NEVER hardcoded here.
// Every deployment sets DB_HOST or SUPABASE_DB_URL in its env.
// ============================================================

import pg from 'pg';

let pool;

export function getPool() {
  if (pool) return pool;
  
  if (process.env.SUPABASE_DB_URL) {
    pool = new pg.Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    const DB_HOST = process.env.DB_HOST;
    if (!DB_HOST) throw new Error('DB_HOST environment variable is required when SUPABASE_DB_URL is not set');
    
    const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
    if (!DB_PASSWORD) throw new Error('SUPABASE_DB_PASSWORD environment variable is required when SUPABASE_DB_URL is not set');
    
    pool = new pg.Pool({
      host: DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'postgres',
      user: 'postgres',
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

export default getPool;
