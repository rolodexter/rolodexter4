import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  agent: string;
  systemArea: string;
}

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="task-list-container overflow-auto max-h-[calc(100vh-12rem)]">
      <AnimatePresence>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="border-[2px] border-white mb-4 p-4 relative overflow-hidden group bg-black hover:bg-white hover:bg-opacity-5 transition-all duration-300"
          >
            {/* Enhanced scanline animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent"
              animate={{
                y: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.1
              }}
              style={{ opacity: 0.08 }}
            />

            {/* Task content */}
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-white mb-2 text-base tracking-[0.15em] font-light uppercase">
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-white tracking-wider">
                    <span className="uppercase">{task.systemArea}</span>
                    <span className="text-white/50">•</span>
                    <span className="font-light">{task.agent}</span>
                  </div>
                </div>
                
                {/* Enhanced status indicator */}
                <div className="relative">
                  <motion.div
                    className={`h-3 w-3 rounded-full border-2 border-white ${
                      task.status === 'active' ? 'bg-white' :
                      task.status === 'pending' ? 'bg-black' :
                      'bg-black'
                    }`}
                    animate={task.status === 'active' ? {
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {task.status === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Enhanced time display */}
              <div className="mt-3 text-xs tracking-[0.2em] text-white/70 font-mono border-t border-white/20 pt-2">
                {new Date(task.lastUpdated).toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </div>
            </div>

            {/* Enhanced hover effect */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-white"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};