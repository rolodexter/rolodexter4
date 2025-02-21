import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const { parse } = await import('node-html-parser');
  const dotenv = await import('dotenv');

  // Load environment variables
  dotenv.config({ path: join(process.cwd(), '.env.local') });

  const prisma = new PrismaClient();

  // Map priority strings to Priority enum
  type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
  function mapPriority(priority: string | undefined): Priority {
    if (!priority) return 'MEDIUM';
    
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return 'HIGH';
      case 'LOW':
        return 'LOW';
      case 'URGENT':
        return 'URGENT';
      default:
        return 'MEDIUM';
    }
  }

  // Map status strings to TaskStatus enum
  type TaskStatus = 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'ARCHIVED';
  function mapStatus(status: string | undefined): TaskStatus {
    if (!status) return 'ACTIVE';
    
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'ACTIVE';
      case 'PENDING':
        return 'PENDING';
      case 'RESOLVED':
        return 'RESOLVED';
      case 'ARCHIVED':
        return 'ARCHIVED';
      case 'IN_PROGRESS':
        return 'ACTIVE';
      default:
        return 'ACTIVE';
    }
  }

  async function scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...await scanDirectory(fullPath));
      } else if (item.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async function parseHtmlFile(filePath: string) {
    const content = readFileSync(filePath, 'utf-8');
    const root = parse(content);

    const title = root.querySelector('title')?.text || 'Untitled';
    const metaTags = root.querySelectorAll('meta');
    
    const metadata: Record<string, string> = {};
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });

    return {
      title,
      content: root.text,
      metadata,
      path: relative(process.cwd(), filePath).replace(/\\/g, '/'),
      type: 'documentation'
    };
  }

  async function seedDatabase() {
    try {
      // Create some initial documents
      const files = await scanDirectory('docs');
      console.log(`Found ${files.length} HTML files to process`);

      // Create tags first
      const tags = ['documentation', 'general', 'samples'];
      for (const tagName of tags) {
        await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
      }

      for (const file of files) {
        const { title, content, metadata, path, type } = await parseHtmlFile(file);
        
        // Use upsert to handle existing documents
        await prisma.document.upsert({
          where: { path },
          update: {
            title,
            content,
            type,
            metadata: metadata as any,
            tags: {
              connect: [
                { name: 'documentation' },
                { name: metadata.category || 'general' }
              ]
            }
          },
          create: {
            title,
            content,
            path,
            type,
            metadata: metadata as any,
            tags: {
              connect: [
                { name: 'documentation' },
                { name: metadata.category || 'general' }
              ]
            }
          }
        });
        console.log(`Upserted document: ${title}`);
      }

      // Create or update test task
      await prisma.task.upsert({
        where: { filePath: '/tasks/sample.md' },
        update: {
          title: 'Sample Task',
          description: 'This is a sample task to test the system',
          status: 'ACTIVE',
          type: 'AGENT',
          priority: 'MEDIUM'
        },
        create: {
          title: 'Sample Task',
          description: 'This is a sample task to test the system',
          status: 'ACTIVE',
          type: 'AGENT',
          priority: 'MEDIUM',
          filePath: '/tasks/sample.md'
        }
      });

      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  await seedDatabase();
}

main().catch(error => {
  console.error('Failed to seed database:', error);
  process.exit(1);
});