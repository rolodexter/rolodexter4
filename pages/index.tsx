import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { motion } from 'framer-motion';
import { FiCpu, FiActivity, FiUsers, FiTarget } from 'react-icons/fi';
import Header from '../components/Header';
import TaskGraph from '../components/TaskGraph';

const DataStreams = () => {
  const [streams, setStreams] = useState<{ left: string; height: string; delay: string }[]>([]);

  useEffect(() => {
    const generateStreams = () => {
      const newStreams = Array.from({ length: 20 }, () => ({
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
  const [activeAgents, setActiveAgents] = useState(42);
  const [todaysOperations, setTodaysOperations] = useState(156);
  const [systemStatus] = useState('OPTIMAL');
  const [recentActivities] = useState([
    { id: 1, type: 'task', message: 'Dependency audit completed', time: '2m ago', xp: '+50 XP' },
    { id: 2, type: 'achievement', message: 'Level 42 reached!', time: '5m ago', xp: '+100 XP' },
    { id: 3, type: 'collaboration', message: 'New agent joined: VisualEngineer', time: '10m ago', xp: '+75 XP' },
  ]);

  const statConfigs = [
    { title: 'Active Agents', value: activeAgents, icon: FiUsers, colorClass: 'text-red-500' },
    { title: 'Operations', value: todaysOperations, icon: FiActivity, colorClass: 'text-blue-500' },
    { title: 'System Load', value: '72%', icon: FiCpu, colorClass: 'text-green-500' },
    { title: 'Objectives', value: '8/10', icon: FiTarget, colorClass: 'text-yellow-500' }
  ];

  const actionButtons = [
    { name: 'INITIATE OPERATION', colorClass: 'text-red-500 hover:text-red-400' },
    { name: 'AGENT ROSTER', colorClass: 'text-blue-500 hover:text-blue-400' },
    { name: 'NEW PROJECT', colorClass: 'text-green-500 hover:text-green-400' },
    { name: 'TACTICAL MANUAL', colorClass: 'text-yellow-500 hover:text-yellow-400' }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgents(prev => prev + Math.floor(Math.random() * 3) - 1);
      setTodaysOperations(prev => prev + Math.floor(Math.random() * 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white cyber-grid relative">
      <DataStreams />
      <div className="scanner-line" />
      <div className="main-container">
        <Header />
        
        <div className="dashboard-container">
          {/* System Metrics Quadrant */}
          <div className="system-metrics hud-panel p-6">
            <h2 className="text-display text-xl mb-4">SYSTEM METRICS</h2>
            <div className="grid grid-cols-2 gap-4">
              {statConfigs.map((stat, index) => (
                <div key={index} className="stat-card hud-panel-secondary p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className={`text-2xl ${stat.colorClass}`} />
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <p className="text-hud mt-2">{stat.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Task Graph Quadrant */}
          <div className="performance-chart hud-panel">
            <TaskGraph />
          </div>

          {/* Mission Log Quadrant */}
          <div className="mission-log hud-panel p-6">
            <h2 className="text-display text-xl mb-4">MISSION LOG</h2>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100%-3rem)]">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="hud-panel-secondary p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-hud text-sm">{activity.time}</span>
                    <span className="text-data text-sm">{activity.xp}</span>
                  </div>
                  <p className="text-hud mt-1">{activity.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Controls Quadrant */}
          <div className="tactical-controls hud-panel p-6">
            <h2 className="text-display text-xl mb-4">TACTICAL CONTROLS</h2>
            <div className="grid grid-cols-2 gap-4">
              {actionButtons.map((action, index) => (
                <motion.button
                  key={index}
                  className={`hud-panel-secondary p-3 text-sm text-tactical ${action.colorClass} hover:bg-gray-800/50 transition-all duration-300`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {action.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;