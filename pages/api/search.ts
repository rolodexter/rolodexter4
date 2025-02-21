import { NextApiRequest, NextApiResponse } from 'next';
import { searchDocuments, testConnection } from '@/lib/db';
import type { SearchResult } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResult[] | { message: string }>
) {
  try {
    // Test database connection first
    await testConnection();
    
    let query: string | undefined;
    
    if (req.method === 'POST') {
      query = req.body.query;
    } else if (req.method === 'GET') {
      query = req.query.q as string;
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log('Search API called with method:', req.method);
    console.log('Search query:', query);

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter' });
    }

    const results = await searchDocuments(query);
    console.log('Search results count:', results.length);

    return res.status(200).json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + (error as Error).message });
  }
}