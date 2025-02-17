import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const execAsync = promisify(exec);

async function checkPostgres() {
  console.log('Checking PostgreSQL 15 service status...');
  
  try {
    // Check if PostgreSQL 15 service is running
    const { stdout: serviceStatus } = await execAsync('sc query "postgresql-x64-15"');
    console.log('PostgreSQL 15 Service Status:', serviceStatus);

    // Try to connect using psql from PostgreSQL 15 installation
    const psqlPath = 'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe';
    const { stdout: psqlVersion } = await execAsync(`"${psqlPath}" --version`);
    console.log('PostgreSQL Client Version:', psqlVersion);

    // Check if port 5432 is listening
    const { stdout: netstat } = await execAsync('netstat -ano | findstr :5432');
    console.log('Port 5432 Status:', netstat);

  } catch (error) {
    console.error('Error checking PostgreSQL:', error);
    // Don't exit on error, try direct connection
    console.log('Attempting direct database connection...');
  }
}

async function testPostgresConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rolodexter4',
    user: 'postgres',
    password: '808080'
  });

  try {
    console.log('Attempting to connect to PostgreSQL...');
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test database creation if rolodexter4 doesn't exist
    const dbResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_database WHERE datname = 'rolodexter4'
      );
    `);
    
    if (!dbResult.rows[0].exists) {
      console.log('Database rolodexter4 does not exist. Creating...');
      // Disconnect from current database to create new one
      await client.end();
      
      // Connect to default postgres database
      const rootClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '808080'
      });
      
      await rootClient.connect();
      await rootClient.query('CREATE DATABASE rolodexter4');
      await rootClient.end();
      
      console.log('Database rolodexter4 created successfully!');
    } else {
      console.log('Database rolodexter4 exists');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
    process.exit(1);
  }
}

// Run checks
console.log('Starting PostgreSQL checks...');
checkPostgres().then(() => {
  testPostgresConnection().catch(console.error);
});