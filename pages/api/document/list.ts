import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { status } = req.query;
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'Status parameter is required' });
    }

    // Get all files recursively from the tasks directory
    const getAllFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else if (path.extname(fullPath) === '.html') {
          files.push(fullPath);
        }
      });
      
      return files;
    };

    const projectRoot = process.cwd();
    const tasksDir = path.join(projectRoot, 'tasks');
    
    if (!fs.existsSync(tasksDir)) {
      return res.status(200).json({ documents: [] });
    }

    const allFiles = getAllFiles(tasksDir);
    
    // Filter files based on status
    const statusPattern = status.toLowerCase();
    const matchingFiles = allFiles.filter(file => {
      const relativePath = path.relative(projectRoot, file);
      const normalizedPath = relativePath.toLowerCase().replace(/\\/g, '/');
      
      if (statusPattern === 'active') {
        return normalizedPath.includes('/active-tasks/') || normalizedPath.includes('/active/');
      } else if (statusPattern === 'pending') {
        return normalizedPath.includes('/pending-tasks/') || normalizedPath.includes('/pending/');
      } else if (statusPattern === 'resolved') {
        return normalizedPath.includes('/resolved-tasks/') || normalizedPath.includes('/resolved/') || normalizedPath.includes('/completed/');
      }
      return false;
    });

    // Read basic info for each matching file
    const documents = await Promise.all(matchingFiles.map(async (file) => {
      const relativePath = path.relative(projectRoot, file);
      const content = fs.readFileSync(file, 'utf-8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : path.basename(file, '.html');

      return {
        path: relativePath.replace(/\\/g, '/'),
        title,
        status: status.toLowerCase()
      };
    }));

    // Return the documents with a basic HTML wrapper for better viewing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Documents with status: ${status}</title>
          <style>
            body { font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .document { margin: 20px 0; padding: 10px; border: 1px solid #eee; }
            .document:hover { background: #f5f5f5; }
            .title { font-weight: bold; }
            .path { color: #666; font-size: 0.9em; }
            a { color: inherit; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Documents with status: ${status.toUpperCase()}</h1>
          ${documents.map(doc => `
            <div class="document">
              <div class="title"><a href="/api/document/${doc.path}">${doc.title}</a></div>
              <div class="path">${doc.path}</div>
            </div>
          `).join('')}
          ${documents.length === 0 ? '<p>No documents found with this status.</p>' : ''}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ 
      message: 'Error listing documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 