import { testDatabaseConnection, prisma } from '../utils/db';

async function testDatabase() {
  console.log('Testing database connections...');
  
  try {
    // Test basic connectivity
    const isConnected = await testDatabaseConnection();
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

testDatabase();