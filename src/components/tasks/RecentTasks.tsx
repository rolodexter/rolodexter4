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

const RecentTasks = () => {
  return (
    <div className="task-monitor">
      <DocumentList
        type="task"
        status="ACTIVE"
        limit={7}
        title="TASK MONITOR"
        showType={false}
      />
    </div>
  );
};

export { RecentTasks }; 