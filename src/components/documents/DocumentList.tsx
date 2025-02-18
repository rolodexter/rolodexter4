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
      <div className="p-4 sm:p-6">
        <h2 className="text-display text-lg sm:text-xl mb-4">{title.toUpperCase()}</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-black/30 p-3 rounded animate-pulse">
              <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <h2 className="text-display text-lg sm:text-xl mb-4">{title.toUpperCase()}</h2>
        <div className="bg-black/30 p-3 rounded text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-display text-lg sm:text-xl mb-4">{title.toUpperCase()}</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-800/30">
            {documents && documents.length > 0 ? (
              documents.map((doc, index) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-2 sm:px-3">
                    <span className="text-sm sm:text-base text-white/90 font-medium">
                      {doc.title.length > 25 ? `${doc.title.substring(0, 25)}...` : doc.title}
                    </span>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs"
                            style={{
                              backgroundColor: tag.color || '#374151',
                              color: 'white'
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-right">
                    <span className="text-[10px] sm:text-xs text-white/50">
                      {new Date(doc.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                        formatMatcher: 'basic'
                      }).replace(',', '')}
                    </span>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-center text-white/50 text-sm">
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