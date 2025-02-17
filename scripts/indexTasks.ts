import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { parse as parseHTML } from 'node-html-parser';

const prisma = new PrismaClient();

const TASK_FOLDERS = [
  'agents/rolodexterVS/tasks/active-tasks',
  'agents/rolodexterVS/tasks/pending-tasks',
  'agents/rolodexterVS/tasks/resolved-tasks',
  'agents/rolodexterVS/tasks/archived'
];

async function getFilesRecursively(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
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

async function getTaskStatus(filePath: string): Promise<string> {
  if (filePath.includes('active-tasks')) return 'active';
  if (filePath.includes('pending-tasks')) return 'pending';
  if (filePath.includes('resolved-tasks')) return 'resolved';
  if (filePath.includes('archived')) return 'archived';
  return 'unknown';
}

async function getTaskTitle(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  const root = parseHTML(content);
  const titleTag = root.querySelector('title');
  if (titleTag) {
    return titleTag.text;
  }
  // Fallback to filename if no title tag
  return path.basename(filePath, '.html');
}

async function indexTasks() {
  try {
    console.log('Starting task indexing...');
    
    for (const folder of TASK_FOLDERS) {
      const fullPath = path.join(process.cwd(), folder);
      console.log(`Processing folder: ${folder}`);
      
      try {
        const files = await getFilesRecursively(fullPath);
        
        for (const file of files) {
          const relativePath = path.relative(process.cwd(), file);
          const status = await getTaskStatus(file);
          const title = await getTaskTitle(file);
          const stats = await fs.stat(file);
          
          await prisma.task.upsert({
            where: { filePath: relativePath },
            update: {
              title,
              status,
              lastModified: stats.mtime
            },
            create: {
              title,
              status,
              filePath: relativePath,
              lastModified: stats.mtime
            }
          });
          
          console.log(`Indexed: ${relativePath}`);
        }
      } catch (error) {
        console.error(`Error processing folder ${folder}:`, error);
      }
    }
    
    console.log('Task indexing completed successfully');
  } catch (error) {
    console.error('Error during task indexing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

indexTasks().catch(console.error);