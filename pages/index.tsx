import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { motion } from 'framer-motion';
import { FiCpu, FiActivity, FiUsers, FiTarget } from 'react-icons/fi';
import { TaskGraph } from '@components/tasks/TaskGraph';
import { TaskVolumeChart } from '@components/tasks/TaskVolumeChart';
import { KnowledgeGraph } from '@components/graphs/KnowledgeGraph';
import { BackgroundAnimation } from '@components/common/BackgroundAnimation';
import { RecentTasks } from '@components/tasks/RecentTasks';

interface StreamData {
  left: string;
  height: string;
  delay: string;
}

const DataStreams = () => {
  const [streams, setStreams] = useState<StreamData[]>([]);

  useEffect(() => {
    const generateStreams = () => {
      const newStreams: StreamData[] = Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        height: `${Math.random() * 30 + 20}%`,
        delay: `-${Math.random() * 3}s`
      }));
      setStreams(newStreams);
    };

    generateStreams();
    const interval = setInterval(generateStreams, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {streams.map((stream, index) => (
        <div
          key={index}
          className="data-stream"
          style={{
            left: stream.left,
            height: stream.height,
            animationDelay: stream.delay
          }}
        />
      ))}
    </>
  );
};

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white cyber-grid relative">
      <DataStreams />
      <div className="scanner-line" />
      <div className="main-container">
        <BackgroundAnimation />
        
        <div className="dashboard-container">
          {/* Current Tasks Quadrant */}
          <div className="current-tasks hud-panel">
            <RecentTasks />
          </div>

          {/* Task Graph Quadrant */}
          <div className="task-graph-container">
            <TaskGraph />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;