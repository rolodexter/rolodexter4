import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  systemArea: string;
  connections: string[];
}

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Area</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {tasks.map(task => {
            const date = new Date(task.lastUpdated);
            const formattedDate = isNaN(date.getTime()) ? 'N/A' : new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).format(date);
            
            return (
              <tr key={task.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{task.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-300">{task.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{task.systemArea}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300" suppressHydrationWarning>{formattedDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};