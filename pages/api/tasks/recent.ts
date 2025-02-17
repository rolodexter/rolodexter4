import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await sql.connect();
    const result = await sql.sql`
      SELECT 
        id,
        title,
        path as file_path,
        created_at as "createdAt",
        updated_at as "updatedAt",
        CASE 
          WHEN path LIKE '%active-tasks%' THEN 'active'
          WHEN path LIKE '%resolved-tasks%' THEN 'resolved'
          WHEN path LIKE '%pending-tasks%' THEN 'pending'
          ELSE 'archived'
        END as status
      FROM documents
      WHERE path LIKE '%/tasks/%'
      ORDER BY updated_at DESC
      LIMIT 10;
    `;

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ 
      message: 'Error fetching recent tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await sql.end();
  }
}