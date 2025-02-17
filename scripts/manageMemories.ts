import { PrismaClient } from '@prisma/client';
import { parse } from 'node-html-parser';
import { readFileSync, readdirSync, unlinkSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string;
  title: string;
  content: string;
}

const prisma = new PrismaClient().$extends({
  model: {
    document: {
      async delete(args: any) {
        return (prisma as any).document.delete(args);
      },
      async upsert(args: any) {
        return (prisma as any).document.upsert(args);
      }
    }
  }
});

const MAX_MEMORIES = 10;
const BASE_DIR = join(process.cwd(), 'agents', 'memories', 'session-logs');

function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function getSessionLogsPath() {
  const now = new Date();
  const year = format(now, 'yyyy');
  const month = format(now, 'MM');
  const path = join(BASE_DIR, year, month);
  ensureDirectoryExists(path);
  return path;
}

function getTodayLogPath() {
  const now = new Date();
  const day = format(now, 'dd');
  return join(getSessionLogsPath(), `${day}.html`);
}

function createOrUpdateDailyLog(entries: LogEntry[]) {
  const logPath = getTodayLogPath();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  let existingContent = '';
  if (existsSync(logPath)) {
    existingContent = readFileSync(logPath, 'utf-8');
  }

  const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="date" content="${today}">
    <title>Session Log: ${today}</title>
    <style>
        :root {
            --primary-bg: #0f172a;
            --primary-text: #f8fafc;
            --accent-green: #4ade80;
            --border-color: #334155;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--primary-bg);
            color: var(--primary-text);
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
        }
        .log-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .log-entry {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            border-left: 4px solid var(--accent-green);
        }
        .timestamp {
            color: var(--accent-green);
            font-family: monospace;
        }
        code {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="log-container">
        <h1>Session Log: ${today}</h1>
        ${existingContent ? existingContent : ''}
        ${entries.map(entry => `
        <div class="log-entry">
            <span class="timestamp">${entry.timestamp}</span>
            <h3>${entry.title}</h3>
            <div class="content">
                ${entry.content}
            </div>
        </div>
        `).join('\n')}
    </div>
</body>
</html>`;

  writeFileSync(logPath, template);
  return relative(process.cwd(), logPath).replace(/\\/g, '/');
}

async function manageMemories() {
  try {
    const MEMORIES_DIR = getSessionLogsPath();
    
    // Get all memory files
    const files = readdirSync(MEMORIES_DIR)
      .filter(f => f.endsWith('.html'))
      .map(f => ({
        name: f,
        path: join(MEMORIES_DIR, f),
        created: new Date(f.split('.')[0])
      }))
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    // Keep only MAX_MEMORIES files
    if (files.length > MAX_MEMORIES) {
      const filesToRemove = files.slice(MAX_MEMORIES);
      for (const file of filesToRemove) {
        const relativePath = relative(process.cwd(), file.path).replace(/\\/g, '/');
        // Remove from filesystem
        unlinkSync(file.path);
        // Remove from database
        await prisma.document.delete({
          where: { path: relativePath }
        }).catch((error: Error) => console.error(`Failed to delete document ${relativePath}:`, error));
        console.log(`Removed old memory: ${file.name}`);
      }
    }

    // Process today's entries
    const todayEntries: LogEntry[] = [];
    const content = readFileSync(getTodayLogPath(), 'utf-8');
    const root = parse(content);
    
    root.querySelectorAll('.log-entry').forEach(entry => {
      const timestamp = entry.querySelector('.timestamp')?.text || '';
      const title = entry.querySelector('h3')?.text || '';
      const content = entry.querySelector('.content')?.text || '';
      todayEntries.push({ timestamp, title, content });
    });

    // Update the daily log file and database
    const relativePath = createOrUpdateDailyLog(todayEntries);
    
    await prisma.document.upsert({
      where: { path: relativePath },
      update: {
        title: `Session Log: ${format(new Date(), 'yyyy-MM-dd')}`,
        content: readFileSync(getTodayLogPath(), 'utf-8'),
        type: 'memory',
        metadata: {
          memoryType: 'session',
          date: format(new Date(), 'yyyy-MM-dd'),
          entries: todayEntries
        },
        updated_at: new Date()
      },
      create: {
        path: relativePath,
        title: `Session Log: ${format(new Date(), 'yyyy-MM-dd')}`,
        content: readFileSync(getTodayLogPath(), 'utf-8'),
        type: 'memory',
        metadata: {
          memoryType: 'session',
          date: format(new Date(), 'yyyy-MM-dd'),
          entries: todayEntries
        }
      }
    });

    console.log('Memory management complete');
  } catch (error) {
    console.error('Error managing memories:', error);
    throw error;
  }
}

// Run the script
manageMemories()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 