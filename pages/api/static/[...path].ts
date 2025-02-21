import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { path } = req.query;
    
    // Ensure path is an array and join it
    const filePath = Array.isArray(path) ? path.join('/') : path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Log the incoming request
    console.log('Static file request:', {
      path: req.query.path,
      filePath
    });

    // Remove any leading 'projects' from the path to avoid duplication
    const cleanPath = filePath.replace(/^projects\/?/, '');
    
    // Try different possible paths
    const possiblePaths = [
      join(process.cwd(), cleanPath),
      join(process.cwd(), 'projects', cleanPath)
    ];
    
    // Find the first path that exists
    const absolutePath = possiblePaths.find(path => existsSync(path));
    
    // Log the resolved path
    console.log('Resolved path:', {
      filePath,
      cleanPath,
      possiblePaths,
      absolutePath,
      exists: !!absolutePath
    });
    
    // Basic security check to prevent directory traversal
    if (absolutePath && !absolutePath.startsWith(process.cwd())) {
      console.error('Security: Directory traversal attempt:', absolutePath);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!absolutePath) {
      console.error('File not found:', possiblePaths);
      return res.status(404).json({ 
        error: 'File not found',
        path: filePath,
        triedPaths: possiblePaths
      });
    }
    
    // Read and return the file
    const content = readFileSync(absolutePath, 'utf-8');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Send the response
    res.status(200).send(content);
  } catch (error) {
    console.error('Error serving static file:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
