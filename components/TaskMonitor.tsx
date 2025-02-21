import React, { useEffect, useState } from 'react';
import TimeDisplay from './TimeDisplay';
import { TaskList } from './TaskList';
import { TaskGraph } from './TaskGraph';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import * as d3 from 'd3';

interface Task extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  systemArea: string;
  connections: string[];
}

interface TaskMonitorProps {
  className?: string;
  defaultPosition?: { x: number; y: number };
}

export const TaskMonitor: React.FC<TaskMonitorProps> = ({ 
  className = '',
  defaultPosition
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [position, setPosition] = useState(defaultPosition || { x: 0, y: 20 });
  const [previousPosition, setPreviousPosition] = useState(defaultPosition || { x: 0, y: 20 });

  useEffect(() => {
    // Set initial position after component mounts
    if (typeof window !== 'undefined' && !defaultPosition) {
      const initialPosition = { x: window.innerWidth - 420, y: 20 };
      setPosition(initialPosition);
      setPreviousPosition(initialPosition);
    }
  }, [defaultPosition]);

  const [tasks] = React.useState<Task[]>([
    {
      id: '01',
      title: 'CORE.PROTOCOL.SYNC',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      systemArea: 'CORE',
      connections: ['02', '08']
    },
    {
      id: '02',
      title: 'SCANNING.NODE.15X',
      status: 'active',
      lastUpdated: new Date(Date.now() - 1000 * 30).toISOString(),
      systemArea: 'SCAN',
      connections: ['01', '03']
    },
    {
      id: '03',
      title: 'MEMORY.SECTOR.7G',
      status: 'pending',
      lastUpdated: new Date(Date.now() - 1000 * 60).toISOString(),
      systemArea: 'MEMORY',
      connections: ['02', '04']
    },
    {
      id: '04',
      title: 'NET.SIGNAL.PARSE',
      status: 'active',
      lastUpdated: new Date(Date.now() - 1000 * 90).toISOString(),
      systemArea: 'NET',
      connections: ['03', '05']
    }
  ]);

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMaximized) setIsMaximized(false);
  };

  const toggleMaximize = () => {
    if (!isMinimized) {
      if (!isMaximized) setPreviousPosition(position);
      setIsMaximized(!isMaximized);
      if (isMaximized) {
        setPosition(previousPosition);
      } else {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const baseStyle = `
    fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden
    ${className}
    ${isMaximized ? 'w-full h-full' : 'w-96'}
    ${isMinimized ? 'h-12' : isMaximized ? 'h-full' : 'h-96'}
  `.trim();

  return (
    <Draggable
      handle=".handle"
      position={position}
      onDrag={handleDrag}
      disabled={isMaximized}
    >
      <div className={baseStyle}>
        <div className="handle bg-gray-900 h-12 flex items-center justify-between px-4 cursor-move">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-gray-300 font-mono text-sm">TASK.MONITOR.SYS</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMinimize}
              className="text-gray-400 hover:text-gray-200"
            >
              {isMinimized ? '□' : '_'}
            </button>
            <button
              onClick={toggleMaximize}
              className="text-gray-400 hover:text-gray-200"
            >
              {isMaximized ? '❐' : '□'}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <TimeDisplay />
                <TaskList tasks={tasks} />
                <TaskGraph nodes={tasks} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Draggable>
  );
};