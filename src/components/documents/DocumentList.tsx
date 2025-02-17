/**
 * DocumentList Component
 * 
 * A reusable component for displaying lists of documents with filtering and real-time updates.
 * Used across various pages to show tasks, memories, and documentation.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Tag {
  name: string;
  color: string | null;
}

interface Document {
  id: string;
  title: string;
  path: string;
  type: 'task' | 'memory' | 'documentation';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

interface DocumentListProps {
  type?: string;
  status?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  title?: string;
  showType?: boolean;
}

const DocumentList = ({ 
  type, 
  status, 
  tags, 
  search, 
  limit = 7,
  title = "Documents",
  showType = true
}: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          ...(type && { type }),
          ...(status && { status }),
          ...(tags?.length && { tags: tags.join(',') }),
          ...(search && { search }),
          limit: limit.toString(),
          offset: '0'
        });

        const response = await fetch(`/api/documents/query?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data.documents);
        setTotal(data.total);
        setError(null);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [type, status, tags, search, limit]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-display text-xl mb-4">{title.toUpperCase()}</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="hud-panel-secondary p-3 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-display text-xl mb-4">{title.toUpperCase()}</h2>
        <div className="hud-panel-secondary p-3 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-display text-xl mb-4">{title.toUpperCase()}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm">
              <th className="pb-2 text-gray-400">TITLE</th>
              {showType && <th className="pb-2 text-gray-400">TYPE</th>}
              <th className="pb-2 text-gray-400">TAGS</th>
              <th className="pb-2 text-gray-400">LAST MODIFIED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {documents && documents.length > 0 ? (
              documents.map((doc, index) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="hover:bg-gray-800/30"
                >
                  <td className="py-2 pr-4">
                    <span className="text-hud truncate block max-w-[200px]">
                      {doc.title}
                    </span>
                  </td>
                  {showType && (
                    <td className="py-2 pr-4">
                      <span className={getTypeColor(doc.type)}>
                        {doc.type.toUpperCase()}
                      </span>
                    </td>
                  )}
                  <td className="py-2 pr-4">
                    <div className="flex gap-1 flex-wrap">
                      {doc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: tag.color || '#374151',
                            color: 'white'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-gray-400">
                    {new Date(doc.updated_at).toLocaleString()}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={showType ? 4 : 3} className="py-4 text-center text-gray-500">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'task':
      return 'text-blue-500';
    case 'memory':
      return 'text-purple-500';
    case 'documentation':
      return 'text-green-500';
    default:
      return 'text-white';
  }
};

export { DocumentList };
export type { DocumentListProps, Document, Tag }; 