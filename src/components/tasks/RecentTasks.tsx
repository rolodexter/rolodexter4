/**
 * RecentTasks Component
 * 
 * A specialized implementation of DocumentList that shows active tasks.
 * Used in the dashboard and task overview pages.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useState } from 'react';
import { DocumentList } from '@components/documents/DocumentList';

type ViewType = 'priority' | 'hierarchy' | 'activity' | 'tags';

const RecentTasks = () => {
  const [currentView, setCurrentView] = useState<ViewType>('priority');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold font-mono">Task Monitor</h1>
        <div className="flex space-x-2 font-mono text-sm">
          <button 
            onClick={() => setCurrentView('priority')}
            className={`px-3 py-1 border ${currentView === 'priority' ? 'bg-black text-white' : 'border-gray-200'}`}
          >
            Priority
          </button>
          <button 
            onClick={() => setCurrentView('hierarchy')}
            className={`px-3 py-1 border ${currentView === 'hierarchy' ? 'bg-black text-white' : 'border-gray-200'}`}
          >
            Hierarchy
          </button>
          <button 
            onClick={() => setCurrentView('activity')}
            className={`px-3 py-1 border ${currentView === 'activity' ? 'bg-black text-white' : 'border-gray-200'}`}
          >
            Activity
          </button>
          <button 
            onClick={() => setCurrentView('tags')}
            className={`px-3 py-1 border ${currentView === 'tags' ? 'bg-black text-white' : 'border-gray-200'}`}
          >
            Tags
          </button>
        </div>
      </div>

      <div className="panel">
        {currentView === 'priority' && (
          <DocumentList
            type="task"
            status="ACTIVE"
            limit={10}
            title="Priority Queue"
            showType={false}
          />
        )}
        {currentView === 'hierarchy' && (
          <DocumentList
            type="task"
            tags={['parent']}
            limit={10}
            title="Task Hierarchy"
            showType={false}
          />
        )}
        {currentView === 'activity' && (
          <DocumentList
            type="task"
            limit={10}
            title="Recent Activity"
            showType={false}
          />
        )}
        {currentView === 'tags' && (
          <DocumentList
            type="task"
            status="ACTIVE"
            limit={10}
            title="Tagged Tasks"
            showType={false}
          />
        )}
      </div>
    </div>
  );
};

export { RecentTasks };