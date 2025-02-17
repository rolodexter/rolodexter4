import { PrismaClient, Priority, TaskStatus } from '@prisma/client';
import { parse } from 'node-html-parser';
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// Map priority strings to Prisma Priority enum
function mapPriority(priority: string | undefined): Priority {
  if (!priority) return Priority.MEDIUM;
  
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return Priority.HIGH;
    case 'LOW':
      return Priority.LOW;
    case 'URGENT':
      return Priority.URGENT;
    default:
      return Priority.MEDIUM;
  }
}

// Map status strings to Prisma TaskStatus enum
function mapStatus(status: string | undefined): TaskStatus {
  if (!status) return TaskStatus.ACTIVE;
  
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return TaskStatus.ACTIVE;
    case 'PENDING':
      return TaskStatus.PENDING;
    case 'RESOLVED':
      return TaskStatus.RESOLVED;
    case 'ARCHIVED':
      return TaskStatus.ARCHIVED;
    case 'IN_PROGRESS':
      return TaskStatus.ACTIVE;
    default:
      return TaskStatus.ACTIVE;
  }
}

async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && !item.name.includes('node_modules')) {
      files.push(...await scanDirectory(fullPath));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function parseHtmlFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const root = parse(content);
  const relativePath = relative(process.cwd(), filePath).replace(/\\/g, '/');

  // Extract metadata from head
  const head = root.querySelector('head');
  const title = head?.querySelector('title')?.text || relativePath;
  const description = head?.querySelector('meta[name="description"]')?.getAttribute('content');
  const status = head?.querySelector('meta[name="task-status"]')?.getAttribute('content');
  const priority = head?.querySelector('meta[name="priority"]')?.getAttribute('content');
  const assignedTo = head?.querySelector('meta[name="assigned-to"]')?.getAttribute('content');

  // Determine document type based on path
  let type = 'documentation';
  if (relativePath.includes('/tasks/')) {
    type = 'task';
  } else if (relativePath.includes('/memories/')) {
    type = 'memory';
  }

  return {
    title,
    content,
    path: relativePath,
    type,
    metadata: {
      description,
      status,
      priority,
      assignedTo
    }
  };
}

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Scan for all HTML files
    console.log('Scanning for HTML files...');
    const files = await scanDirectory(process.cwd());
    console.log(`Found ${files.length} HTML files`);

    // Process each file
    for (const file of files) {
      const fileData = await parseHtmlFile(file);
      console.log(`Processing ${fileData.path}...`);

      try {
        // Create or update document
        const document = await prisma.document.upsert({
          where: { path: fileData.path },
          update: {
            title: fileData.title,
            content: fileData.content,
            type: fileData.type,
            metadata: fileData.metadata,
            updated_at: new Date()
          },
          create: {
            title: fileData.title,
            content: fileData.content,
            path: fileData.path,
            type: fileData.type,
            metadata: fileData.metadata
          }
        });

        // If it's a task, create or update task record
        if (fileData.type === 'task') {
          await prisma.task.upsert({
            where: { filePath: fileData.path },
            update: {
              title: fileData.title,
              status: mapStatus(fileData.metadata.status as string),
              priority: mapPriority(fileData.metadata.priority as string),
              assignee: fileData.metadata.assignedTo,
              document_id: document.id,
              updated_at: new Date()
            },
            create: {
              title: fileData.title,
              filePath: fileData.path,
              status: mapStatus(fileData.metadata.status as string),
              priority: mapPriority(fileData.metadata.priority as string),
              assignee: fileData.metadata.assignedTo,
              document_id: document.id
            }
          });
        }

        console.log(`✓ Processed ${fileData.path}`);
      } catch (error) {
        console.error(`Error processing ${fileData.path}:`, error);
      }
    }

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDatabase().catch(error => {
  console.error('Failed to seed database:', error);
  process.exit(1);
}); 