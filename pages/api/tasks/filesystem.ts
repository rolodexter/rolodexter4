import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const TASK_FOLDERS = [
  'agents/rolodexterVS/tasks/active-tasks',
  'agents/rolodexterVS/tasks/pending-tasks'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filesystemTasks = [];
    
    for (const folder of TASK_FOLDERS) {
      try {
        const fullPath = path.join(process.cwd(), folder);
        const files = await fs.readdir(fullPath, { withFileTypes: true });
        const htmlFiles = files.filter(f => f.isFile() && f.name.endsWith('.html'));
        
        for (const file of htmlFiles) {
          const filePath = path.join(fullPath, file.name);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Extract title from HTML content if possible
          let title = file.name.replace('.html', '');
          const titleMatch = content.match(/<title>(.*?)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1];
          }
          
          filesystemTasks.push({
            id: path.join(folder, file.name),
            title,
            status: folder.includes('active-tasks') ? 'active' : 'pending',
            file_path: path.join(folder, file.name),
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
            tags: [],
            priority: 'MEDIUM'
          });
        }
      } catch (err) {
        console.error(`Error reading folder ${folder}:`, err);
      }
    }

    // Sort by last modified date and take most recent 7
    filesystemTasks.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return res.status(200).json(filesystemTasks.slice(0, 7));
  } catch (error) {
    console.error('Error fetching filesystem tasks:', error);
    return res.status(500).json({ message: 'Error fetching tasks' });
  }
}