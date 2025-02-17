import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../utils/db';
import type { Document } from '@prisma/client';

interface GraphDocument {
  id: string;
  title: string;
  path: string;
  content: string;
  type: string;
  created_at: Date;
  updated_at: Date;
}

interface GraphReference {
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface GraphResponse {
  nodes: Array<{
    id: string;
    title: string;
    path: string;
    type: string;
    created_at: Date;
  }>;
  links: GraphReference[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GraphResponse | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching documents from database...');
    
    // Fetch all documents using Prisma
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        path: true,
        content: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`Found ${documents.length} documents`);

    // Generate references between documents based on content and paths
    const references: GraphReference[] = [];

    // Process documents to find references
    documents.forEach((doc: GraphDocument) => {
      documents.forEach((otherDoc: GraphDocument) => {
        if (doc.id === otherDoc.id) return;

        let weight = 0;

        // Check for title mentions in content (weight: 0.4)
        if (doc.content?.toLowerCase().includes(otherDoc.title.toLowerCase())) {
          weight += 0.4;
        }

        // Check for path references (weight: 0.3)
        if (doc.content?.includes(otherDoc.path)) {
          weight += 0.3;
        }

        // Check for same directory/category (weight: 0.2)
        const docDirs = doc.path.split('/');
        const otherDirs = otherDoc.path.split('/');
        if (docDirs[0] === otherDirs[0] && docDirs[1] === otherDirs[1]) {
          weight += 0.2;
        }

        // Check for direct links or references (weight: 0.5)
        if (doc.content?.includes(`href="${otherDoc.path}"`) || 
            (doc.content?.includes('Related Tasks:') && doc.content?.includes(otherDoc.path))) {
          weight += 0.5;
        }

        // Only add reference if there's a meaningful connection
        if (weight > 0) {
          references.push({
            source: doc.id,
            target: otherDoc.id,
            type: 'reference',
            weight
          });
        }
      });
    });

    console.log('References generated:', references.length);

    const response: GraphResponse = {
      nodes: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        path: doc.path,
        type: doc.type,
        created_at: doc.created_at
      })),
      links: references
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ 
      message: 'Error fetching graph data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}