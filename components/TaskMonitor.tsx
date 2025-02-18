import React from 'react';
import { TimeDisplay } from './TimeDisplay';
import { TaskList } from './TaskList';
import { TaskGraph } from './TaskGraph';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  systemArea: string;
}

export const TaskMonitor: React.FC = () => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [previousPosition, setPreviousPosition] = React.useState({ x: 0, y: 0 });
  const [tasks] = React.useState<Task[]>([
    {
      id: '01',
      title: 'CORE.PROTOCOL.SYNC',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      systemArea: 'CORE'
    },
    {
      id: '02',
      title: 'SCANNING.NODE.15X',
      status: 'active',
      lastUpdated: new Date(Date.now() - 1000 * 30).toISOString(),
      systemArea: 'SCAN'
    },
    {
      id: '03',
      title: 'MEMORY.SECTOR.7G',
      status: 'pending',
      lastUpdated: new Date(Date.now() - 1000 * 60).toISOString(),
      systemArea: 'MEMORY'
    },
    {
      id: '04',
      title: 'NET.SIGNAL.PARSE',
      status: 'active',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      systemArea: 'NETWORK'
    },
    {
      id: '05',
      title: 'DATA.STREAM.0X4F',
      status: 'resolved',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      systemArea: 'DATA'
    },
    {
      id: '06',
      title: 'SYSTEM.PATCH.9D',
      status: 'pending',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      systemArea: 'SYSTEM'
    },
    {
      id: '07',
      title: 'NODE.ANALYZE.3H',
      status: 'active',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      systemArea: 'NODE'
    },
    {
      id: '08',
      title: 'CORE.MAP.SYNC',
      status: 'resolved',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      systemArea: 'CORE'
    }
  ]);

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    if (!isMaximized) {
      setPosition({ x: data.x, y: data.y });
    }
  };

  const handleDragStart = () => {
    if (!isMaximized) {
      setPreviousPosition(position);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMaximized) {
      setIsMaximized(false);
      setPosition(previousPosition);
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setPosition(previousPosition);
    } else {
      setPreviousPosition(position);
      setPosition({ x: 0, y: 0 });
    }
    setIsMaximized(!isMaximized);
    if (isMinimized) setIsMinimized(false);
  };

  const windowVariants = {
    maximized: {
      x: 0,
      y: 0,
      width: '100%',
      height: '100%',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    normal: {
      width: '80vw',
      height: '80vh',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    minimized: {
      y: 'calc(100vh - 2.5rem)',
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const contentVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 }
    },
    hidden: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      <Draggable
        handle=".window-handle"
        position={isMaximized ? { x: 0, y: 0 } : position}
        onDrag={handleDrag}
        onStart={handleDragStart}
        disabled={isMaximized}
        bounds="parent"
      >
        <motion.div 
          className="fixed bg-black border-2 border-white"
          initial={false}
          animate={
            isMaximized ? 'maximized' : 
            isMinimized ? 'minimized' : 
            'normal'
          }
          variants={windowVariants}
        >
          {/* Window Controls */}
          <div className="window-handle absolute top-0 left-0 right-0 h-10 border-b-2 border-white flex items-center justify-between px-4 bg-black cursor-move select-none">
            <div className="flex items-center space-x-6">
              <h1 className="text-white text-sm tracking-[0.5em] uppercase font-light">TaskMonitor</h1>
              <div className="h-px w-32 bg-white" />
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleMinimize}
                className="w-3 h-3 border border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <span className="transform translate-y-[-2px]">−</span>
              </button>
              <button 
                onClick={toggleMaximize}
                className="w-3 h-3 border border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <span className="transform translate-y-[-2px]">{isMaximized ? '□' : '⨉'}</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div 
                className="p-6 pt-12 h-full"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {/* Background Grid */}
                <div 
                  className="absolute inset-0 opacity-10" 
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, white 1px, transparent 1px),
                      linear-gradient(to bottom, white 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                <div className="relative z-10 h-full">
                  {/* Corner Frames */}
                  <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-white" />
                  <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-white" />

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <section className="border-2 border-white bg-black/50 backdrop-blur-sm p-6">
                      <h2 className="text-white text-sm tracking-[0.3em] uppercase mb-6 font-light flex items-center">
                        <span className="h-px w-4 bg-white mr-4" />
                        System Tasks
                      </h2>
                      <TaskList tasks={tasks} />
                    </section>

                    <section className="border-2 border-white bg-black/50 backdrop-blur-sm p-6">
                      <h2 className="text-white text-sm tracking-[0.3em] uppercase mb-6 font-light flex items-center">
                        <span className="h-px w-4 bg-white mr-4" />
                        Network View
                      </h2>
                      <TaskGraph nodes={tasks} />
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanline Effect */}
          <motion.div 
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 0.03) 50%)',
              backgroundSize: '100% 4px'
            }}
            animate={{
              backgroundPosition: ['0px 0px', '0px 4px']
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              ease: 'steps(1)'
            }}
          />
        </motion.div>
      </Draggable>
    </AnimatePresence>
  );
};