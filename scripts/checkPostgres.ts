import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkPostgres() {
  console.log('Checking PostgreSQL service status...');
  
  try {
    // Check if PostgreSQL service is running
    const { stdout: serviceStatus } = await execAsync('sc query postgresql-x64-15');
    console.log('PostgreSQL Service Status:', serviceStatus);

    // Try to connect using psql
    const { stdout: psqlVersion } = await execAsync('psql --version');
    console.log('PostgreSQL Client Version:', psqlVersion);

    // Check if port 5432 is listening
    const { stdout: netstat } = await execAsync('netstat -ano | findstr :5432');
    console.log('Port 5432 Status:', netstat);

  } catch (error) {
    console.error('Error checking PostgreSQL:', error);
    process.exit(1);
  }
}

checkPostgres();