import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { parse as parseHTML } from 'node-html-parser';

const prisma = new PrismaClient();

const TASK_FOLDERS = [
  // Agent tasks
  'agents/rolodexterVS/tasks/active-tasks',
  'agents/rolodexterVS/tasks/pending-tasks',
  'agents/rolodexterVS/tasks/resolved-tasks',
  'agents/rolodexterVS/tasks/archived',
  // Project tasks
  'projects/rolodexter4/token-gating/01-research-planning/tasks',
  'projects/rolodexter4/token-gating/02-environment-setup/tasks',
  'projects/rolodexter4/token-gating/03-authentication/tasks',
  'projects/rolodexter4/token-gating/04-access-control/tasks',
  'projects/rolodexter4/token-gating/05-whitelist-approval/tasks',
  'projects/rolodexter4/token-gating/06-testing-validation/tasks',
  'projects/rolodexter4/token-gating/07-deployment-launch/tasks',
  'projects/rolodexter4/token-gating/08-post-launch-improvements/tasks'
];

type TaskStatus = 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'ARCHIVED';
type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
type TaskType = 'AGENT' | 'PROJECT';

interface TaskMetadata {
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  tags: string[];
  connections: string[];
}

async function getFilesRecursively(baseDir: string): Promise<string[]> {
  const fullPath = path.join(process.cwd(), baseDir);
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(baseDir, entry.name);
        const fullEntryPath = path.join(process.cwd(), entryPath);
        if (entry.isDirectory()) {
          return getFilesRecursively(entryPath);
        } else if (entry.name.endsWith('.html')) {
          return [entryPath]; // Return relative path
        }
        return [];
      })
    );
    return files.flat();
  } catch (error) {
    console.error(`Error reading directory ${baseDir}:`, error);
    return [];
  }
}

async function getTaskMetadata(filePath: string, content: string): Promise<TaskMetadata> {
  const root = parseHTML(content);
  
  // Get status from meta tag or infer from path
  let status: TaskStatus = 'PENDING';
  const statusMeta = root.querySelector('meta[name="task-status"]');
  if (statusMeta) {
    status = statusMeta.getAttribute('content')?.toUpperCase() as TaskStatus || status;
  } else {
    status = await inferTaskStatus(filePath);
  }

  // Get priority from meta tag
  let priority: TaskPriority = 'MEDIUM';
  const priorityMeta = root.querySelector('meta[name="task-priority"]');
  if (priorityMeta) {
    priority = priorityMeta.getAttribute('content')?.toUpperCase() as TaskPriority || priority;
  }

  // Get task type based on path
  const type: TaskType = filePath.startsWith('agents/') ? 'AGENT' : 'PROJECT';

  // Get tags from meta tag
  const tags: string[] = [];
  const tagsMeta = root.querySelector('meta[name="graph-tags"]');
  if (tagsMeta) {
    const tagsContent = tagsMeta.getAttribute('content');
    if (tagsContent) {
      tags.push(...tagsContent.split(',').map(tag => tag.trim()));
    }
  }

  // Get connections from meta tag
  const connections: string[] = [];
  const connectionsMeta = root.querySelector('meta[name="graph-connections"]');
  if (connectionsMeta) {
    const connectionsContent = connectionsMeta.getAttribute('content');
    if (connectionsContent) {
      connections.push(...connectionsContent.split(',').map(conn => conn.trim()));
    }
  }

  return { status, priority, type, tags, connections };
}

async function inferTaskStatus(filePath: string): Promise<TaskStatus> {
  if (filePath.includes('active-tasks')) return 'ACTIVE';
  if (filePath.includes('pending-tasks')) return 'PENDING';
  if (filePath.includes('resolved-tasks')) return 'RESOLVED';
  if (filePath.includes('archived')) return 'ARCHIVED';
  
  // For project tasks, infer from the stage number
  const stagePath = filePath.split(path.sep).find(part => part.match(/^\d{2}-/));
  if (stagePath) {
    const stageNumber = parseInt(stagePath.substring(0, 2));
    // Tasks in earlier stages are more likely to be active
    return stageNumber <= 2 ? 'ACTIVE' : 'PENDING';
  }
  
  return 'PENDING';
}

async function getTaskTitle(content: string): Promise<string> {
  const root = parseHTML(content);
  const titleTag = root.querySelector('title');
  if (titleTag) {
    return titleTag.text;
  }
  return 'Untitled Task';
}

async function indexTasks() {
  console.log('Starting task indexing...');
  
  for (const folder of TASK_FOLDERS) {
    try {
      const files = await getFilesRecursively(folder);
      
      for (const file of files) {
        const fullPath = path.join(process.cwd(), file);
        const content = await fs.readFile(fullPath, 'utf-8');
        const root = parseHTML(content);
        
        // Extract task content
        const titleElement = root.querySelector('title');
        const title = titleElement ? titleElement.text : path.basename(file, '.html');
        
        // Get description from first paragraph or div
        const descriptionElement = root.querySelector('p, div');
        const description = descriptionElement ? descriptionElement.text : '';
        
        const { status, priority, type, tags } = await getTaskMetadata(file, content);
        
        // Create or update task in database
        const task = await prisma.task.upsert({
          where: { filePath: file },
          update: {
            title,
            description,
            status,
            priority,
            type,
            updated_at: new Date(),
            tags: {
              connectOrCreate: tags.map(tag => ({
                where: { name: tag },
                create: { name: tag }
              }))
            }
          },
          create: {
            filePath: file,
            title,
            description,
            status,
            priority,
            type,
            created_at: new Date(),
            updated_at: new Date(),
            tags: {
              connectOrCreate: tags.map(tag => ({
                where: { name: tag },
                create: { name: tag }
              }))
            }
          }
        });

        console.log(`Indexed task: ${title} (${file})`);
      }
    } catch (error) {
      console.error(`Error processing folder ${folder}:`, error);
    }
  }
  
  console.log('Task indexing completed');
}

indexTasks().catch(console.error);