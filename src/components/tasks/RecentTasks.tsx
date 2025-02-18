/**
 * RecentTasks Component
 * 
 * A specialized implementation of DocumentList that shows active tasks.
 * Used in the dashboard and task overview pages.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { DocumentList } from '@components/documents/DocumentList';

export const RecentTasks = () => {
  return (
    <div className="p-4">
      <DocumentList 
        type="task"
        limit={20}
        showType={false}
      />
    </div>
  );
};