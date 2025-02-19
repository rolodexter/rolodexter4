import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const TASK_FOLDERS = [
  'agents/rolodexterVS/tasks/active-tasks',
  'agents/rolodexterVS/tasks/pending-tasks'
];

async function getFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getFilesRecursively(fullPath);
      } else if (entry.name.endsWith('.html')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
}

async function syncTasksToBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  try {
    console.log('Starting task sync to Vercel Blob Storage...');
    
    for (const folder of TASK_FOLDERS) {
      const fullPath = join(process.cwd(), folder);
      console.log(`Processing folder: ${folder}`);
      
      try {
        const files = await getFilesRecursively(fullPath);
        
        for (const file of files) {
          const relativePath = relative(process.cwd(), file);
          const content = await readFile(file, 'utf-8');
          
          await put(relativePath, content, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'text/html',
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          
          console.log(`Synced: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Error processing folder ${folder}:`, error);
      }
    }
    
    console.log('Task sync completed successfully');
  } catch (error) {
    console.error('Error during task sync:', error);
  }
}

// Run if this is the main module
syncTasksToBlob().catch(error => {
  console.error('Failed to sync tasks:', error);
  process.exit(1);
});

export { syncTasksToBlob };