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
import { format, isValid } from 'date-fns';

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
  limit = 10,
  title = "Documents",
  showType = true,
  sortBy = 'updated_at',
  groupBy
}: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDocuments();
  }, [type, status, tags, search, limit, sortBy, groupBy]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (tags) params.append('tags', tags.join(','));
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (groupBy) params.append('groupBy', groupBy);

      const response = await fetch(`/api/tasks/recent?${params}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const renderPriorityIndicator = (priority?: string) => {
    if (!priority) return null;
    
    const colors = {
      HIGH: 'text-red-500',
      MEDIUM: 'text-yellow-500',
      LOW: 'text-green-500'
    };

    return (
      <span className={`${colors[priority as keyof typeof colors]} font-bold`}>
        [{priority}]
      </span>
    );
  };

  const renderStatus = (status: string) => {
    const statusColors = {
      ACTIVE: 'text-green-500',
      PENDING: 'text-yellow-500',
      BLOCKED: 'text-red-500',
      COMPLETED: 'text-blue-500'
    };

    return (
      <span className={`${statusColors[status as keyof typeof statusColors]} text-xs`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return 'N/A';
      }
      return format(date, 'MM.dd.yy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="text-sm">
        <div className="animate-pulse">Loading system data...</div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {documents.map((doc, index) => (
        <div 
          key={doc.id}
          className="animate-fadeIn"
          style={{ 
            animationDelay: `${index * 50}ms`,
            opacity: 0,
          }}
        >
          <div className="flex group cursor-pointer" onClick={() => toggleRowExpansion(doc.id)}>
            <span className="mr-1 group-hover:animate-pulse">▶</span>
            <span className="group-hover:underline">{doc.title}</span>
            <span className="ml-1 animate-blink">N/A</span>
          </div>
          {expandedRows.has(doc.id) && (
            <div 
              className="pl-4 animate-slideDown"
              style={{ animationDelay: '100ms' }}
            >
              {doc.tasks?.map((task, taskIndex) => (
                <div 
                  key={taskIndex}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${taskIndex * 50}ms` }}
                >
                  {task.description && (
                    <div className="text-gray-400 my-1">{task.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { DocumentList };
export type { DocumentListProps, Document, Tag };