import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { path: docPath } = req.query;
    
    if (!docPath || !Array.isArray(docPath)) {
      return res.status(400).json({ message: 'Invalid path' });
    }

    const filePath = path.join(process.cwd(), ...docPath);
    
    // Security check: ensure the file is within allowed directories
    const relativePath = path.relative(process.cwd(), filePath);
    const allowedDirs = ['projects', 'agents', 'tasks', 'memories'];
    const isAllowedPath = allowedDirs.some(dir => relativePath.startsWith(dir));
    
    if (!isAllowedPath) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists and is HTML
    if (!fs.existsSync(filePath) || path.extname(filePath) !== '.html') {
      return res.status(404).json({ message: 'Document not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.status(200).send(content);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ 
      message: 'Error serving document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 