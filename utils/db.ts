import { createClient } from '@vercel/postgres';

const client = createClient({
  connectionString: process.env.POSTGRES_URL
});

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  created_at: Date;
  updated_at: Date;
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    await client.connect();
    await client.sql`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ts_document tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('english', title), 'A') ||
          setweight(to_tsvector('english', content), 'B')
        ) STORED
      );

      CREATE INDEX IF NOT EXISTS idx_documents_ts ON documents USING GIN (ts_document);
      CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
      CREATE INDEX IF NOT EXISTS idx_documents_dates ON documents(created_at, updated_at);
    `;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Search documents
export async function searchDocuments(query: string) {
  try {
    await client.connect();
    const searchResults = await client.sql`
      SELECT 
        id,
        title,
        content,
        path,
        ts_rank(ts_document, websearch_to_tsquery('english', ${query})) as rank,
        ts_headline('english', content, websearch_to_tsquery('english', ${query}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as excerpt
      FROM documents
      WHERE ts_document @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT 10;
    `;
    return searchResults.rows;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Insert or update a document
export async function upsertDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) {
  try {
    await client.connect();
    const result = await client.sql`
      INSERT INTO documents (title, content, path)
      VALUES (${doc.title}, ${doc.content}, ${doc.path})
      ON CONFLICT (path) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to upsert document:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Test database connection
export async function testConnection() {
  try {
    await client.connect();
    await client.sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    await client.end();
  }
}

export { client as sql }; 