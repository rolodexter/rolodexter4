import { useState, useEffect } from 'react';
import useSWR from 'swr';

export type TaskData = {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee: string | null;
  metadata: any;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  subtasks: TaskData[];
};

export type ViewMode = 'network' | 'hierarchy' | 'timeline' | 'matrix';

export const useTaskData = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [rotationPaused, setRotationPaused] = useState(false);

  const { data: tasks, error } = useSWR<TaskData[]>('/api/tasks', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }, {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  // Auto-rotate view modes every 45 seconds unless paused
  useEffect(() => {
    if (rotationPaused) return;

    const modes: ViewMode[] = ['network', 'hierarchy', 'timeline', 'matrix'];
    const timer = setInterval(() => {
      setViewMode(current => {
        const currentIndex = modes.indexOf(current);
        return modes[(currentIndex + 1) % modes.length];
      });
    }, 45000);

    return () => clearInterval(timer);
  }, [rotationPaused]);

  const toggleRotation = () => setRotationPaused(!rotationPaused);
  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    setRotationPaused(true);
  };

  return {
    tasks,
    error,
    viewMode,
    rotationPaused,
    toggleRotation,
    setView
  };
};