import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

async function testDirectConnection() {
  console.log('Testing PostgreSQL Connection');
  console.log('----------------------------');
  console.log('Environment Variables:');
  console.log(`Host: ${process.env.POSTGRES_HOST}`);
  console.log(`Port: ${process.env.POSTGRES_PORT}`);
  console.log(`Database: ${process.env.POSTGRES_DATABASE}`);
  console.log(`User: ${process.env.POSTGRES_USER}`);
  console.log(`SSL Enabled: ${process.env.POSTGRES_SSL}`);
  console.log('----------------------------');

  const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`;
  const pool = new Pool({
    connectionString,
    ssl: process.env.POSTGRES_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('Attempting to connect to PostgreSQL...');
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    console.log('Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    console.log('Testing schema access...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', tables.rows.map(row => row.table_name));
    
    client.release();
    await pool.end();
    console.log('Connection pool closed');

  } catch (err) {
    const error = err as PostgresError;
    console.error('Failed to connect to PostgreSQL:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure PostgreSQL is running on the specified host and port');
    } else if (error.code === '28P01') {
      console.error('Authentication failed. Check your username and password');
    } else if (error.code === '3D000') {
      console.error('Database does not exist. Make sure to create it first');
    } else {
      console.error('Unexpected error:', error.message);
    }
    
    process.exit(1);
  }
}

testDirectConnection();