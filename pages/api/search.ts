import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const client = await pool.connect();

    try {
      // Use plainto_tsquery for basic full-text search
      const result = await client.query(`
        SELECT 
          id,
          title,
          content,
          path,
          type,
          created_at,
          updated_at,
          ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) as rank
        FROM "Document"
        WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 10
      `, [q]);

      // Format results
      const searchResults = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        path: row.path,
        type: row.type,
        metadata: {
          excerpt: row.content.substring(0, 200) + '...',
          rank: parseFloat(row.rank)
        },
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return res.status(200).json({ results: searchResults });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Search failed', details: error instanceof Error ? error.message : String(error) });
  }
}