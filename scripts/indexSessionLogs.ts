import { prisma } from '../utils/db';
import { parse } from 'node-html-parser';
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { MemoryType } from '@prisma/client';

async function indexSessionLogs() {
  const baseDir = join(process.cwd(), 'agents', 'memories', 'session-logs');
  const years = readdirSync(baseDir).filter(f => !f.startsWith('.'));

  for (const year of years) {
    const yearPath = join(baseDir, year);
    const months = readdirSync(yearPath);

    for (const month of months) {
      const monthPath = join(yearPath, month);
      const logs = readdirSync(monthPath).filter(f => f.endsWith('.html'));

      for (const log of logs) {
        const logPath = join(monthPath, log);
        const relativePath = relative(process.cwd(), logPath).replace(/\\/g, '/');
        const content = readFileSync(logPath, 'utf-8');
        const root = parse(content);

        // Extract log entries
        const entries = root.querySelectorAll('.log-entry').map(entry => {
          const timestamp = entry.querySelector('.timestamp')?.text || '';
          const text = entry.text.replace(timestamp, '').trim();
          return { timestamp, text };
        });

        // Create or update the document
        const document = await prisma.document.upsert({
          where: { path: relativePath },
          update: {
            title: `Session Log: ${year}-${month}-${log.replace('.html', '')}`,
            content: content,
            type: 'memory',
            metadata: {
              entries: entries,
              year,
              month,
              day: log.replace('.html', '')
            },
            updated_at: new Date()
          },
          create: {
            path: relativePath,
            title: `Session Log: ${year}-${month}-${log.replace('.html', '')}`,
            content: content,
            type: 'memory',
            metadata: {
              entries: entries,
              year,
              month,
              day: log.replace('.html', '')
            }
          }
        });

        // Create memory entries for each log entry
        for (const entry of entries) {
          await prisma.memory.create({
            data: {
              type: MemoryType.OBSERVATION,
              content: entry.text,
              metadata: {
                timestamp: entry.timestamp,
                source: relativePath
              },
              document: {
                connect: {
                  id: document.id
                }
              }
            }
          });
        }

        console.log(`Indexed ${relativePath}`);
      }
    }
  }

  console.log('Session logs indexing complete');
}

indexSessionLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 