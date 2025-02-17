import { NextApiRequest, NextApiResponse } from 'next';
import { searchDocuments } from '@/utils/db';

interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
  rank: number;
}

interface RawSearchResult {
  title: string;
  path: string;
  excerpt: string;
  rank: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    
    // Format results
    const formattedResults: SearchResult[] = results.map((doc: RawSearchResult) => ({
      title: doc.title,
      path: doc.path,
      excerpt: doc.excerpt,
      rank: parseFloat(doc.rank)
    }));

    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 