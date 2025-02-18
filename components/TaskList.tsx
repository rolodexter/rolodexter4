import React from 'react';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  systemArea: string;
}

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-white/20 hover:border-white/40 transition-colors p-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-white text-xs tracking-[0.2em] font-light">
                {task.title}
              </h3>
              <div className="text-white/50 text-[10px] tracking-wider mt-1 font-mono">
                {task.systemArea}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.div 
                className={`w-1.5 h-1.5 rounded-full ${
                  task.status === 'active' ? 'bg-white' : 
                  task.status === 'pending' ? 'bg-white/50' : 
                  'bg-white/20'
                }`}
                animate={task.status === 'active' ? {
                  opacity: [1, 0.5, 1]
                } : undefined}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-white/30 text-[10px] font-mono tracking-wider">
              {new Date(task.lastUpdated).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};