import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Missing file path' });
    }

    const normalizedPath = path.join(process.cwd(), filePath.replace(/\\/g, '/'));
    const content = await fs.readFile(normalizedPath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (error) {
    console.error('Error serving task file:', error);
    res.status(404).json({ error: 'Task file not found' });
  }
}