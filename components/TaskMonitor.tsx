import React from 'react';
import { TimeDisplay } from './TimeDisplay';
import { TaskList } from './TaskList';
import { TaskGraph } from './TaskGraph';
import { motion } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  lastUpdated: string;
  systemArea: string;
}

export const TaskMonitor: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-black">
      {/* Background Grid */}
      <div 
        className="fixed inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10 p-6">
        {/* Corner Frames */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-white" />
        <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-white" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-white" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-white" />

        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h1 className="text-white text-xl tracking-[0.5em] uppercase font-light">Monitor</h1>
              <div className="h-px w-32 bg-white" />
            </div>
            <TimeDisplay />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
          <section className="border-2 border-white bg-black/50 backdrop-blur-sm p-6">
            <h2 className="text-white text-sm tracking-[0.3em] uppercase mb-6 font-light flex items-center">
              <span className="h-px w-4 bg-white mr-4" />
              System Tasks
            </h2>
            <TaskList tasks={tasks} />
          </section>

          <section className="border-2 border-white bg-black/50 backdrop-blur-sm p-6"></section>
            <h2 className="text-white text-sm tracking-[0.3em] uppercase mb-6 font-light flex items-center">
              <span className="h-px w-4 bg-white mr-4" />
              Network View
            </h2>
            <TaskGraph nodes={tasks} />
          </section>
        </div>
      </div>

      {/* Scanline Effect */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-50"
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
    </div>
  );
};