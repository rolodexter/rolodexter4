import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface DocumentNode {
  id: string;
  title: string;
  path: string;
  content: string;
}

interface Reference {
  source: string;
  target: string;
  confidence: number;
}

interface GraphData {
  documents: DocumentNode[];
  references: {
    [key: string]: Reference[];
  };
}

// Cache the graph data
let cachedData: GraphData | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

function getAllHtmlFiles(dir: string, fileList: string[] = []): string[] {
  // Only search in specific directories
  const allowedDirs = ['projects', 'agents', 'tasks', 'memories'];
  
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(process.cwd(), filePath);
      const isAllowedDir = allowedDirs.some(allowed => relativePath.startsWith(allowed));
      
      if (fs.statSync(filePath).isDirectory() && isAllowedDir) {
        getAllHtmlFiles(filePath, fileList);
      } else if (path.extname(file) === '.html' && isAllowedDir) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return fileList;
}

function generateDocumentId(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check cache
    const now = Date.now();
    if (cachedData && (now - lastCacheTime < CACHE_DURATION)) {
      return res.status(200).json(cachedData);
    }

    // Get all HTML files from specific directories
    const projectRoot = process.cwd();
    const htmlFiles = getAllHtmlFiles(projectRoot);

    // Create document nodes
    const documents: DocumentNode[] = htmlFiles.map(filePath => {
      const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.html');

      return {
        id: generateDocumentId(relativePath),
        title,
        path: relativePath,
        content
      };
    });

    // Generate references between documents
    const references = {
      link_reference: documents.flatMap(doc => {
        const links: Reference[] = [];
        documents.forEach(otherDoc => {
          if (doc.id !== otherDoc.id) {
            const relativePath = path.relative(path.dirname(doc.path), otherDoc.path);
            if (doc.content.includes(relativePath) || doc.content.includes(otherDoc.path)) {
              links.push({
                source: doc.id,
                target: otherDoc.id,
                confidence: 1.0
              });
            }
          }
        });
        return links;
      }),
      content_reference: documents.flatMap(doc => {
        const refs: Reference[] = [];
        documents.forEach(otherDoc => {
          if (doc.id !== otherDoc.id && doc.content.toLowerCase().includes(otherDoc.title.toLowerCase())) {
            refs.push({
              source: doc.id,
              target: otherDoc.id,
              confidence: 0.7
            });
          }
        });
        return refs;
      })
    };

    // Update cache
    cachedData = { documents, references };
    lastCacheTime = now;

    res.status(200).json(cachedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error fetching graph data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}