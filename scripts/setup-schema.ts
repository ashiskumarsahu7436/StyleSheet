import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupSchema() {
  try {
    console.log('Creating stylesheet_app schema if not exists...');
    await pool.query('CREATE SCHEMA IF NOT EXISTS stylesheet_app');
    
    console.log('✅ Schema setup complete!');
  } catch (error) {
    console.error('Error setting up schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSchema();
