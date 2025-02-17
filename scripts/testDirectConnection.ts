import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDirectConnection() {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
    ssl: process.env.POSTGRES_SSL === 'true' ? {
      rejectUnauthorized: false
    } : undefined
  });

  try {
    console.log('Attempting to connect to PostgreSQL...');
    console.log(`Host: ${process.env.POSTGRES_HOST}`);
    console.log(`Port: ${process.env.POSTGRES_PORT}`);
    console.log(`Database: ${process.env.POSTGRES_DATABASE}`);
    console.log(`User: ${process.env.POSTGRES_USER}`);
    
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
  } finally {
    await client.end();
  }
}

testDirectConnection();