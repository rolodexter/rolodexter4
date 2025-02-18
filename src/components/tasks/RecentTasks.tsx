/**
 * RecentTasks Component
 * 
 * A specialized implementation of DocumentList that shows active tasks.
 * Used in the dashboard and task overview pages.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useState, useEffect } from 'react';
import { DocumentList } from '@components/documents/DocumentList';
import { format } from 'date-fns';

type ViewType = 'priority' | 'hierarchy' | 'activity' | 'tags';

export const RecentTasks = () => {
  const [currentView, setCurrentView] = useState<ViewType>('priority');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimestamp = (date: Date) => {
    try {
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="p-4 font-mono text-white bg-black min-h-screen">
      <div className="mb-4">
        <h1 className="text-lg mb-2">TASK MONITOR v4.0</h1>
        <div className="mb-1">[-]</div>
        <div className="mb-1">SYS:ACTIVE</div>
        <div className="mb-2">NODE:ROLODEXTER4•ONLINE</div>
        <div className="flex gap-1 mb-4">
          <button 
            onClick={() => setCurrentView('priority')}
            className="px-2 border border-white hover:bg-white hover:text-black"
          >
            [PRIORITY_VIEW]
          </button>
          <button 
            onClick={() => setCurrentView('hierarchy')}
            className="px-2 border border-white hover:bg-white hover:text-black"
          >
            [HIERARCHY_VIEW]
          </button>
          <button 
            onClick={() => setCurrentView('activity')}
            className="px-2 border border-white hover:bg-white hover:text-black"
          >
            [ACTIVITY_LOG]
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-4 animate-stream">
        <DocumentList 
          type="task"
          sortBy={currentView === 'priority' ? 'priority' : 'updated_at'}
          groupBy={currentView === 'hierarchy' ? 'status' : undefined}
          showType={false}
          limit={20}
        />
      </div>

      {/* Status Footer */}
      <div className="text-sm space-y-0.5">
        <div>MEMORY:STABLE</div>
        <div>CPU:NOMINAL</div>
        <div>NETWORK:ACTIVE</div>
        <div>LAST_SYNC: {formatTimestamp(currentTime)}</div>
      </div>
    </div>
  );
};