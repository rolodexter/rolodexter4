import React from 'react';

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
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map(task => {
            const date = new Date(task.lastUpdated);
            const formattedDate = isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            return (
              <tr key={task.id} className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap">{task.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{task.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{task.systemArea}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formattedDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};