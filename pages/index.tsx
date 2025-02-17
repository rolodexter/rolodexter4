import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { motion } from 'framer-motion';
import { FiCpu, FiActivity, FiUsers, FiTarget } from 'react-icons/fi';
import TimeDisplay from '../components/TimeDisplay';
import TaskVolumeChart from '../components/TaskVolumeChart';

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
      <div className="main-container p-4">
        {/* Enhanced HUD Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hud-panel header-panel p-8 mb-8 relative"
        >
          {/* Top Status Bar */}
          <div className="absolute top-0 left-0 w-full h-8 border-b border-red-500/30 flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <div className="status-indicator"></div>
              <span className="text-xs font-mono text-red-500/70">SYS.4.2.1</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-red-500/70">UPTIME:</span>
                <TimeDisplay />
              </div>
              <div className="flex items-center space-x-2 text-red-500">
                <span className="text-xs font-mono">SYSTEM STATUS:</span>
                <motion.span 
                  className="text-xs font-mono"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {systemStatus}
                </motion.span>
              </div>
            </div>
          </div>

          {/* Main Title with Enhanced Effects */}
          <div className="relative mt-4">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            <h1 className="text-6xl font-bold mb-2 font-mono text-center relative">
              <span className="text-red-500 relative">
                ROLODEXTER
                <motion.span
                  className="absolute -top-1 left-0 w-full h-full text-blue-500 opacity-50"
                  animate={{ opacity: [0.5, 0.3, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ROLODEXTER
                </motion.span>
              </span>
              <span className="text-blue-500 ml-2">4</span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          </div>

          {/* Enhanced Subtitle */}
          <div className="relative">
            <p className="text-xl text-center font-mono text-gray-400 mt-4">
              <motion.span
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                TACTICAL AI COLLABORATION INTERFACE
              </motion.span>
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <div className="header-stat">
                <span className="text-xs text-red-500/70">AGENTS</span>
                <span className="text-sm text-red-500">{activeAgents}</span>
              </div>
              <div className="header-stat">
                <span className="text-xs text-red-500/70">OPS</span>
                <span className="text-sm text-red-500">{todaysOperations}</span>
              </div>
              <div className="header-stat">
                <span className="text-xs text-red-500/70">PERF</span>
                <span className="text-sm text-red-500">98.2%</span>
              </div>
            </div>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/50"></div>
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/50"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/50"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/50"></div>
        </motion.div>

        {/* Dashboard Quadrant Grid */}
        <div className="dashboard-container">
          {/* System Metrics Quadrant */}
          <div className="system-metrics hud-panel p-6">
            <h2 className="text-xl font-mono text-red-500 mb-4">SYSTEM METRICS</h2>
            <div className="grid grid-cols-2 gap-4">
              {statConfigs.map((stat, index) => (
                <div key={index} className="stat-card hud-panel-secondary p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className={`text-2xl ${stat.colorClass}`} />
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{stat.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart Quadrant */}
          <div className="performance-chart relative">
            <TaskVolumeChart />
          </div>

          {/* Mission Log Quadrant */}
          <div className="mission-log hud-panel p-6">
            <h2 className="text-xl font-mono text-red-500 mb-4">MISSION LOG</h2>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100%-3rem)]">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="hud-panel-secondary p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{activity.time}</span>
                    <span className="text-green-500 text-sm">{activity.xp}</span>
                  </div>
                  <p className="text-sm mt-1">{activity.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Controls Quadrant */}
          <div className="tactical-controls hud-panel p-6">
            <h2 className="text-xl font-mono text-red-500 mb-4">TACTICAL CONTROLS</h2>
            <div className="grid grid-cols-2 gap-4">
              {actionButtons.map((action, index) => (
                <button
                  key={index}
                  className={`hud-panel-secondary p-3 text-sm font-mono ${action.colorClass} hover:bg-gray-800/50 transition-all duration-300`}
                >
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;