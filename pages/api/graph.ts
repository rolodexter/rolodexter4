import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface DocumentNode {
  id: string;
  title: string;
  path: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    tags?: string[];
    status?: string;
    priority?: string;
    sequence?: string;
    author?: string;
    category?: string;
    related?: string[];
    type?: string;
    area?: string;
  };
}

interface Reference {
  source: string;
  target: string;
  confidence: number;
  type: 'link' | 'title' | 'directory' | 'temporal' | 'content' | 'tag' | 'sequence' | 'author' | 'category' | 'area' | 'related' | 'modification' | 'naming' | 'depth' | 'size';
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

function getDirectoryDepth(filePath: string): number {
  return filePath.split('/').length - 1;
}

function getCommonAncestorDepth(path1: string, path2: string): number {
  const parts1 = path1.split('/');
  const parts2 = path2.split('/');
  let commonDepth = 0;
  
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      commonDepth++;
    } else {
      break;
    }
  }
  return commonDepth;
}

function getFileNamePattern(fileName: string): string {
  // Remove extension and convert to lowercase
  const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
  // Extract patterns like 'task-123', 'v1.2.3', dates, etc.
  const patterns = {
    hasNumber: /\d+/.test(baseName),
    hasDate: /\d{4}-\d{2}-\d{2}/.test(baseName),
    hasVersion: /v\d+/.test(baseName),
    prefix: baseName.split('-')[0],
    suffix: baseName.split('-').pop()
  };
  return JSON.stringify(patterns);
}

function extractMetadata(content: string): DocumentNode['metadata'] {
  const metadata: Required<NonNullable<DocumentNode['metadata']>> = {
    tags: [],
    status: '',
    priority: '',
    sequence: '',
    author: '',
    category: '',
    related: [],
    type: '',
    area: ''
  };
  
  // Extract all meta tags
  const metaRegex = /<meta\s+name="([^"]+)"\s+content="([^"]+)"/g;
  let match;
  
  while ((match = metaRegex.exec(content)) !== null) {
    const [_, name, value] = match;
    switch (name) {
      case 'tags':
        metadata.tags = value.split(',').map(tag => tag.trim());
        break;
      case 'status':
        metadata.status = value;
        break;
      case 'priority':
        metadata.priority = value;
        break;
      case 'sequence':
        metadata.sequence = value;
        break;
      case 'author':
        metadata.author = value;
        break;
      case 'category':
        metadata.category = value;
        break;
      case 'related':
        metadata.related = value.split(',').map(rel => rel.trim());
        break;
      case 'type':
        metadata.type = value;
        break;
      case 'area':
        metadata.area = value;
        break;
    }
  }
  
  return metadata;
}

function getFileStats(filePath: string) {
  const stats = fs.statSync(filePath);
  return {
    created_at: stats.birthtime.toISOString(),
    updated_at: stats.mtime.toISOString()
  };
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
      const stats = getFileStats(filePath);
      const metadata = extractMetadata(content);

      return {
        id: generateDocumentId(relativePath),
        title,
        path: relativePath,
        content,
        ...stats,
        metadata
      };
    });

    // Generate all references
    const allReferences = {
      // Keep only the most important reference types
      link_reference: documents.flatMap(doc => {
        const links: Reference[] = [];
        documents.forEach(otherDoc => {
          if (doc.id !== otherDoc.id) {
            const relativePath = path.relative(path.dirname(doc.path), otherDoc.path);
            if (doc.content.includes(relativePath) || doc.content.includes(otherDoc.path)) {
              links.push({
                source: doc.id,
                target: otherDoc.id,
                confidence: 1.0,
                type: 'link'
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
              confidence: 0.7,
              type: 'title'
            });
          }
        });
        return refs;
      }),

      explicit_related: documents.flatMap(doc => {
        const refs: Reference[] = [];
        const related = doc.metadata?.related;
        if (!related?.length) return refs;
        
        documents.forEach(otherDoc => {
          if (doc.id !== otherDoc.id && 
              (related.includes(otherDoc.path) || 
               related.includes(otherDoc.title))) {
            refs.push({
              source: doc.id,
              target: otherDoc.id,
              confidence: 0.9,
              type: 'related'
            });
          }
        });
        return refs;
      }),

      directory_reference: documents.flatMap(doc => {
        const refs: Reference[] = [];
        documents.forEach(otherDoc => {
          if (doc.id !== otherDoc.id) {
            const docDir = path.dirname(doc.path);
            const otherDir = path.dirname(otherDoc.path);
            
            // Only include direct parent-child relationships
            if (otherDir === docDir || otherDir.startsWith(docDir + '/')) {
              refs.push({
                source: doc.id,
                target: otherDoc.id,
                confidence: 0.5,
                type: 'directory'
              });
            }
          }
        });
        return refs;
      })
    };

    // Filter and limit references
    const MAX_REFERENCES_PER_NODE = 5;
    const MIN_CONFIDENCE = 0.5;

    // Combine and filter references
    const allRefs = Object.values(allReferences).flat();
    
    // Group references by source node
    const referencesBySource = new Map<string, Reference[]>();
    allRefs.forEach(ref => {
      if (ref.confidence >= MIN_CONFIDENCE) {
        const sourceRefs = referencesBySource.get(ref.source) || [];
        sourceRefs.push(ref);
        referencesBySource.set(ref.source, sourceRefs);
      }
    });

    // Limit references per node
    const limitedRefs: Reference[] = [];
    referencesBySource.forEach((refs, source) => {
      // Sort by confidence and take top N
      const topRefs = refs
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, MAX_REFERENCES_PER_NODE);
      limitedRefs.push(...topRefs);
    });

    // Update cache with filtered references
    cachedData = { 
      documents, 
      references: { filtered: limitedRefs }
    };
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