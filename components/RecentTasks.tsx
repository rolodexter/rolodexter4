import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: string;
  file_path: string;
  createdAt: string;
  updatedAt: string;
}

const RecentTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentTasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tasks/recent');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching recent tasks:', error);
        setError('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTasks();
    const interval = setInterval(fetchRecentTasks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'resolved':
        return 'text-blue-500';
      case 'archived':
        return 'text-gray-500';
      default:
        return 'text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-display text-xl mb-4">CURRENT TASKS</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="hud-panel-secondary p-3 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-display text-xl mb-4">CURRENT TASKS</h2>
        <div className="hud-panel-secondary p-3 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-display text-xl mb-4">CURRENT TASKS</h2>
      <div className="space-y-3">
        {tasks && tasks.length > 0 ? (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className="hud-panel-secondary p-3 flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <span className="text-hud truncate flex-1">{task.title}</span>
              <span className={`ml-4 ${getStatusColor(task.status)}`}>
                {task.status.toUpperCase()}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="hud-panel-secondary p-3 text-gray-500">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTasks;