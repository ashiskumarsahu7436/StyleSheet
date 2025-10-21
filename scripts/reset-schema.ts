import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetSchema() {
  try {
    console.log('Dropping old tables from public schema...');
    await pool.query('DROP TABLE IF EXISTS public.sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS public.spreadsheets CASCADE');
    await pool.query('DROP TABLE IF EXISTS public.users CASCADE');
    
    console.log('Dropping stylesheet_app schema if exists...');
    await pool.query('DROP SCHEMA IF EXISTS stylesheet_app CASCADE');
    
    console.log('Creating fresh stylesheet_app schema...');
    await pool.query('CREATE SCHEMA IF NOT EXISTS stylesheet_app');
    
    console.log('✅ Schema reset complete! Now run: npm run db:push');
  } catch (error) {
    console.error('Error resetting schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetSchema();
