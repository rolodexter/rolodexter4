import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { motion } from 'framer-motion';
import { FiCpu, FiActivity, FiUsers, FiTarget } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

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

// Performance Chart Component
const PerformanceChart = () => {
  const [data, setData] = useState<{ time: string; value: number; critical: boolean }[]>([]);
  const [perfStatus, setPerfStatus] = useState('NOMINAL');

  useEffect(() => {
    // Initialize with more dramatic data
    const initialData = Array.from({ length: 10 }, (_, i) => ({
      time: `${i}s`,
      value: Math.floor(Math.random() * 40) + 60,
      critical: false
    }));
    setData(initialData);

    // Update with more dramatic changes
    const interval = setInterval(() => {
      setData(prevData => {
        const newValue = Math.floor(Math.random() * 40) + 60;
        const isCritical = newValue < 70;
        const newData = [...prevData.slice(1), {
          time: `${prevData.length}s`,
          value: newValue,
          critical: isCritical
        }];
        
        // Update performance status
        const avgValue = newData.reduce((acc, curr) => acc + curr.value, 0) / newData.length;
        setPerfStatus(avgValue < 70 ? 'CRITICAL' : avgValue < 80 ? 'SUBOPTIMAL' : 'NOMINAL');
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const status = value < 70 ? 'CRITICAL' : value < 80 ? 'WARNING' : 'OPTIMAL';
      const statusColor = value < 70 ? '#ff0000' : value < 80 ? '#ffaa00' : '#00ff00';
      
      return (
        <div className="custom-tooltip bg-black/90 border border-[#ff3a3a] p-3 rounded-lg backdrop-blur-sm">
          <p className="font-mono text-sm">TIME: <span className="text-blue-400">{label}</span></p>
          <p className="font-mono text-sm">PERF: <span className="text-red-400">{value.toFixed(2)}%</span></p>
          <p className="font-mono text-sm">STATUS: <span style={{ color: statusColor }}>{status}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="hud-panel p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="scanner-overlay"></div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-red-500 text-sm uppercase font-mono relative z-10">System Performance</h3>
        <motion.span 
          className={`text-sm font-mono ${
            perfStatus === 'CRITICAL' ? 'text-red-500' :
            perfStatus === 'SUBOPTIMAL' ? 'text-yellow-500' :
            'text-green-500'
          }`}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          STATUS: {perfStatus}
        </motion.span>
      </div>

      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3a3a" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff3a3a" stopOpacity={0}/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <XAxis 
              dataKey="time" 
              stroke="#4B5563"
              tick={{ fill: '#4B5563', fontSize: 12 }}
              axisLine={{ stroke: '#FF3A3A', strokeWidth: 1 }}
            />
            <YAxis 
              stroke="#4B5563"
              tick={{ fill: '#4B5563', fontSize: 12 }}
              domain={[0, 100]}
              axisLine={{ stroke: '#FF3A3A', strokeWidth: 1 }}
            />
            <Tooltip content={customTooltip} />
            
            {/* Area under the line */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#perfGradient)"
              fillOpacity={0.2}
            />
            
            {/* Main performance line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#FF3A3A"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              filter="url(#glow)"
            />
            
            {/* Critical points */}
            <Line
              type="monotone"
              dataKey={data.map(d => d.critical ? d.value : null)}
              stroke="#FF0000"
              strokeWidth={4}
              dot={{ r: 6, fill: '#FF0000', filter: 'url(#glow)' }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Grid overlay effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="grid-overlay"></div>
        </div>
      </div>
    </div>
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
        <div className="max-w-7xl mx-auto">
          {/* HUD Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hud-panel p-8 mb-12 relative"
          >
            <div className="absolute top-2 right-2 flex items-center space-x-2 text-red-500">
              <span className="text-sm font-mono">SYSTEM STATUS:</span>
              <span className="font-mono animate-pulse">{systemStatus}</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 font-mono text-center">
              <span className="text-red-500">ROLODEXTER</span>
              <span className="text-blue-500">4</span>
            </h1>
            <p className="text-xl text-center font-mono text-gray-400">
              TACTICAL AI COLLABORATION INTERFACE
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="dashboard-grid mb-12">
            {statConfigs.map((stat, index) => (
              <motion.div 
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="hud-panel p-6"
              >
                <div className="flex items-center justify-between">
                  <stat.icon className={`${stat.colorClass} text-2xl`} />
                  <h3 className={`${stat.colorClass} text-sm uppercase font-mono`}>{stat.title}</h3>
                </div>
                <p className="stat-value mt-2">{stat.value}</p>
                <div className="progress-bar mt-4">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: typeof stat.value === 'string' ? stat.value : `${(stat.value / 200) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="mb-12">
            <PerformanceChart />
          </div>

          {/* Activity Feed */}
          <div className="hud-panel p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-mono text-red-500">MISSION LOG</h2>
              <div className="h-1 flex-1 mx-4 bg-red-500/20">
                <div className="h-full w-3/4 bg-red-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-800/50 hud-border"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'task' ? 'bg-green-500' :
                      activity.type === 'achievement' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    } shadow-glow`} />
                    <p className="text-gray-200 font-mono">{activity.message}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-400 font-mono text-sm">{activity.xp}</span>
                    <span className="text-gray-400 font-mono text-sm">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-grid">
            {actionButtons.map((action, index) => (
              <motion.button
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`hud-panel p-4 font-mono ${action.colorClass}`}
              >
                {action.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;