import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the project root
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('BLOB_STORE_NAME:', process.env.BLOB_STORE_NAME);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const prisma = new PrismaClient();

// All folders that might contain HTML files
const HTML_FOLDERS = [
  // Task folders
  'agents/rolodexterVS/tasks/active-tasks',
  'agents/rolodexterVS/tasks/pending-tasks',
  'agents/rolodexterVS/tasks/resolved-tasks',
  'agents/rolodexterVS/tasks/archived',
  'agents/rolodexterGPT/tasks',
  'agents/JoeMaristela/tasks',
  'agents/VisualEngineer/tasks',
  // Memory folders
  'agents/memories',
  'agents/memories/dictionaries',
  'agents/memories/session-logs',
  'agents/memories/technical',
  // Project tasks
  'projects/community/tasks',
  'projects/research/tasks',
  'projects/rolodexter-labs/tasks'
];

async function getFilesRecursively(dir: string): Promise<string[]> {
  try {
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
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error);
    return [];
  }
}

async function determineFileType(filePath: string): Promise<'task' | 'memory' | 'documentation'> {
  if (filePath.includes('/tasks/')) return 'task';
  if (filePath.includes('/memories/')) return 'memory';
  return 'documentation';
}

async function extractMetadata(content: string, filePath: string) {
  const metadata: Record<string, any> = {};
  
  // Extract title from HTML content
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1];
  } else {
    metadata.title = filePath.split('/').pop()?.replace('.html', '') || 'Untitled';
  }

  // Extract description if available
  const descMatch = content.match(/<meta name="description" content="(.*?)">/);
  if (descMatch && descMatch[1]) {
    metadata.description = descMatch[1];
  }

  // Extract status for tasks
  if (filePath.includes('/tasks/')) {
    if (filePath.includes('/active-tasks/')) metadata.status = 'ACTIVE';
    else if (filePath.includes('/pending-tasks/')) metadata.status = 'PENDING';
    else if (filePath.includes('/resolved-tasks/')) metadata.status = 'RESOLVED';
    else if (filePath.includes('/archived/')) metadata.status = 'ARCHIVED';
    else metadata.status = 'PENDING';
  }

  // Extract tags from meta tags if available
  const tagsMatch = content.match(/<meta name="keywords" content="(.*?)">/);
  if (tagsMatch && tagsMatch[1]) {
    metadata.tags = tagsMatch[1].split(',').map(t => t.trim());
  }

  return metadata;
}

async function syncHtmlToBlob() {
  if (!process.env.BLOB_STORE_NAME) {
    throw new Error('BLOB_STORE_NAME environment variable is not set. Check .env.local file.');
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set. Check .env.local file.');
  }

  try {
    console.log('Starting HTML files sync to Vercel Blob Storage and PostgreSQL...');
    console.log(`Using blob store: ${process.env.BLOB_STORE_NAME}`);
    
    for (const folder of HTML_FOLDERS) {
      const fullPath = join(process.cwd(), folder);
      console.log(`Processing folder: ${folder}`);
      
      try {
        const files = await getFilesRecursively(fullPath);
        
        for (const file of files) {
          const relativePath = relative(process.cwd(), file);
          const content = await readFile(file, 'utf-8');
          const fileType = await determineFileType(relativePath);
          const metadata = await extractMetadata(content, relativePath);
          
          // Sync to Blob storage
          await put(relativePath, content, {
            access: 'public',
            addRandomSuffix: false,
            store: process.env.BLOB_STORE_NAME
          });
          
          // Sync to PostgreSQL
          await prisma.document.upsert({
            where: { path: relativePath },
            update: {
              title: metadata.title,
              content,
              type: fileType,
              metadata,
              updated_at: new Date(),
              tags: {
                connectOrCreate: metadata.tags?.map((tag: string) => ({
                  where: { name: tag },
                  create: { name: tag }
                })) || []
              }
            },
            create: {
              title: metadata.title,
              content,
              path: relativePath,
              type: fileType,
              metadata,
              tags: {
                connectOrCreate: metadata.tags?.map((tag: string) => ({
                  where: { name: tag },
                  create: { name: tag }
                })) || []
              }
            }
          });

          // If it's a task, also update the Task table
          if (fileType === 'task') {
            await prisma.task.upsert({
              where: { filePath: relativePath },
              update: {
                title: metadata.title,
                status: metadata.status,
                description: metadata.description,
                updated_at: new Date()
              },
              create: {
                title: metadata.title,
                status: metadata.status,
                description: metadata.description,
                filePath: relativePath,
                priority: 'MEDIUM'
              }
            });
          }
          
          console.log(`Synced: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Error processing folder ${folder}:`, error);
      }
    }
    
    console.log('HTML files sync completed successfully');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Direct execution without module detection
syncHtmlToBlob().catch(error => {
  console.error('Failed to sync HTML files:', error);
  process.exit(1);
});

export { syncHtmlToBlob };