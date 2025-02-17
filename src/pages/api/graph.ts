import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@/lib/db';

interface Document {
  id: string;
  title: string;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching documents from database...');
    
    // Fetch all documents
    await sql.connect();
    const result = await sql.sql`
      SELECT 
        id,
        title,
        path,
        content,
        created_at,
        updated_at
      FROM documents
      WHERE path LIKE '%/tasks/%' OR path LIKE '%/memories/%'
      ORDER BY created_at DESC;
    `;

    console.log(`Found ${result.rows.length} documents`);
    const documents = result.rows as Document[];

    // Generate references between documents based on content and paths
    const references: Record<string, Array<{ source: string; target: string; confidence: number }>> = {
      title_mention: [],
      path_reference: [],
      task_reference: [],
      memory_reference: []
    };

    // Process documents to find references
    documents.forEach((doc) => {
      documents.forEach((otherDoc) => {
        if (doc.id === otherDoc.id) return;

        // Check for title mentions in content
        if (doc.content?.toLowerCase().includes(otherDoc.title.toLowerCase())) {
          references.title_mention.push({
            source: doc.id,
            target: otherDoc.id,
            confidence: 0.8
          });
        }

        // Check for path references
        if (doc.content?.includes(otherDoc.path)) {
          references.path_reference.push({
            source: doc.id,
            target: otherDoc.id,
            confidence: 1.0
          });
        }

        // Check for task references
        if (doc.path.includes('/tasks/') && otherDoc.path.includes('/tasks/') &&
            doc.content?.toLowerCase().includes(otherDoc.title.toLowerCase())) {
          references.task_reference.push({
            source: doc.id,
            target: otherDoc.id,
            confidence: 0.9
          });
        }

        // Check for memory references
        if (doc.path.includes('/memories/') && 
            doc.content?.toLowerCase().includes(otherDoc.title.toLowerCase())) {
          references.memory_reference.push({
            source: doc.id,
            target: otherDoc.id,
            confidence: 0.7
          });
        }
      });
    });

    console.log('References generated:', {
      title_mentions: references.title_mention.length,
      path_references: references.path_reference.length,
      task_references: references.task_reference.length,
      memory_references: references.memory_reference.length
    });

    const response = {
      documents,
      references
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ 
      message: 'Error fetching graph data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  } finally {
    await sql.end();
  }
} 