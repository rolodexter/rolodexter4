import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import { testConnection, prisma } from '../utils/db.js';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

async function testDatabase() {
  console.log('Testing database connections...');
  
  try {
    // Test basic connectivity
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }

    // Test Document table
    const documentCount = await prisma.document.count();
    console.log(`Current document count: ${documentCount}`);

    // Test Task table
    const taskCount = await prisma.task.count();
    console.log(`Current task count: ${taskCount}`);

    console.log('All database tests passed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase();