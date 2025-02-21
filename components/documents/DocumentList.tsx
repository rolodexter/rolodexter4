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
  key?: number;
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
  limit = 20,
  title = "Documents",
  showType = true,
  sortBy = 'updated_at',
  groupBy
}: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="font-mono text-sm whitespace-pre">
      <div>ID</div>
      <div>Task</div>
      <div>Status</div>
      <div>Priority</div>
      {documents.map((doc, index) => (
        <React.Fragment key={doc.id}>
          {(index + 1).toString().padStart(2, '0')}
          {'\n'}
          {doc.title}
          {'\n'}
          {doc.tasks?.[0]?.status || '-'}
          {'\n'}
          {doc.tasks?.[0]?.priority || '-'}
          {'\n'}
        </React.Fragment>
      ))}
    </div>
  );
};

export { DocumentList };
export type { DocumentListProps, Document, Tag };