/**
 * DocumentList Component
 * 
 * A reusable component for displaying lists of documents with filtering and real-time updates.
 * Used across various pages to show tasks, memories, and documentation.
 * Implements a terminal-style interface with clear visual hierarchy and monospace typography.
 * 
 * Related Tasks:
 * - UI Overhaul: projects/rolodexter4/ui/tasks/in-review/header-footer-task.html
 * - UI Testing Templates: projects/rolodexter4/ui/tasks/ui-testing-templates.html
 * 
 * Related Memories:
 * - Session Log (2025-02-19): agents/memories/session-logs/2025/02/19.html
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
  tasks?: Array<{
    status: string;
    priority: string;
    description?: string;
  }>;
}

interface DocumentListProps {
  type?: string;
  status?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  title?: string;
  showType?: boolean;
  sortBy?: 'priority' | 'due_date' | 'updated_at';
  groupBy?: 'status' | 'priority' | 'tags';
}

const DocumentList = ({ 
  type, 
  status, 
  tags, 
  search, 
  limit = 7,
  title = "Documents",
  showType = true,
  sortBy = 'updated_at',
  groupBy
}: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          ...(type && { type }),
          ...(status && { status }),
          ...(tags?.length && { tags: tags.join(',') }),
          ...(search && { search }),
          ...(sortBy && { sortBy }),
          ...(groupBy && { groupBy }),
          limit: limit.toString(),
          offset: '0'
        });

        const response = await fetch(`/api/documents/query?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data.documents);
        setError(null);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchDocuments, 30000); // Poll every 30 seconds
    
    return () => clearInterval(pollInterval);
  }, [type, status, tags, search, limit, sortBy, groupBy]);

  const formatTitle = (title: string, maxLength: number = 50): string => {
    if (title.length >= maxLength) {
      return title.substring(0, maxLength - 3) + '...';
    }
    return title.padEnd(maxLength, '.');
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderPriorityIndicator = (priority?: string) => {
    if (!priority) return null;
    const indicators = {
      URGENT: '[***]',
      HIGH: '[**]',
      MEDIUM: '[*]',
      LOW: '[ ]'
    };
    const colors = {
      URGENT: 'text-black font-mono font-bold',
      HIGH: 'text-black font-mono',
      MEDIUM: 'text-gray-600 font-mono',
      LOW: 'text-gray-400 font-mono'
    };
    return (
      <span className={`mr-2 ${colors[priority as keyof typeof colors]}`}>
        {indicators[priority as keyof typeof indicators] || ''}
      </span>
    );
  };

  const renderStatus = (status: string) => {
    const styles = {
      ACTIVE: 'bg-black text-white',
      PENDING: 'bg-gray-200 text-gray-800',
      RESOLVED: 'bg-gray-100 text-gray-600',
      ARCHIVED: 'bg-gray-50 text-gray-400'
    };
    return (
      <span className={`px-2 py-0.5 rounded-sm text-xs ${styles[status as keyof typeof styles]}`}>
        {formatStatus(status)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-mono mb-4">{title}</h2>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border p-2 rounded">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-mono mb-4">{title}</h2>
        <div className="border border-gray-200 p-3 rounded text-gray-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono">
      <h2 className="text-lg mb-4 font-bold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 px-4 text-left font-medium">Title</th>
              <th className="py-2 px-4 text-left font-medium w-24">Status</th>
              <th className="py-2 px-4 text-left font-medium w-32">Updated</th>
            </tr>
          </thead>
          <tbody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRowExpansion(doc.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {renderPriorityIndicator(doc.tasks?.[0]?.priority)}
                        <span className="font-medium">{formatTitle(doc.title)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {doc.tasks?.[0]?.status && renderStatus(doc.tasks[0].status)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {format(new Date(doc.updated_at), 'M/d HH:mm')}
                    </td>
                  </tr>
                  {expandedRows.has(doc.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-4">
                        <div className="text-sm space-y-2">
                          {doc.tags.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Tags:</span>
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.map((tag, i) => (
                                  <span 
                                    key={i} 
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    #{tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-gray-600">
                            Path: <span className="font-medium">{doc.path}</span>
                          </div>
                          {doc.tasks?.[0]?.description && (
                            <div className="text-gray-600 whitespace-pre-line">
                              {doc.tasks[0].description}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const formatStatus = (status: string): string => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export { DocumentList };
export type { DocumentListProps, Document, Tag };