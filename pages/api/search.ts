import { NextApiRequest, NextApiResponse } from 'next';
import { searchDocuments, type Document } from '@/utils/db';

interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
  rank: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResult[] | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const results = await searchDocuments(query);
    
    // Format results with proper type handling
    const formattedResults: SearchResult[] = results.map((doc: Document) => ({
      title: doc.title || "",
      path: doc.path || "",
      excerpt: typeof doc.metadata?.excerpt === 'string' ? doc.metadata.excerpt : "",
      rank: typeof doc.metadata?.rank === 'number' ? doc.metadata.rank : 0
    }));

    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 