import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area
} from 'recharts';

interface TaskGraphData {
  time: string;
  dependencies: number;
  connections: number;
  completed: number;
  pending: number;
}

const generateMockData = (count: number): TaskGraphData[] => {
  return Array.from({ length: count }, (_, i) => ({
    time: `${i}m`,
    dependencies: Math.floor(Math.random() * 40) + 60,
    connections: Math.floor(Math.random() * 100),
    completed: Math.floor(Math.random() * 60),
    pending: Math.floor(Math.random() * 40)
  }));
};

class GraphErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Graph Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-red-500 font-mono">Graph Error - Reloading...</span>
        </div>
      );
    }

    return this.props.children;
  }
}

const TaskGraph = () => {
  const [data, setData] = useState<TaskGraphData[]>([]);
  const [status, setStatus] = useState('NOMINAL');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let mounted = true;
    console.log('TaskGraph mounted');

    const logDimensions = () => {
      if (!mounted || !containerRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    };

    // Initialize with mock data
    const initialData = generateMockData(20);
    setData(initialData);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (mounted) logDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      logDimensions();
    }

    // Set up data update interval
    intervalRef.current = setInterval(() => {
      if (!mounted) return;
      
      setData(prevData => {
        const newData = [...prevData.slice(1), {
          time: `${prevData.length}m`,
          dependencies: Math.floor(Math.random() * 40) + 60,
          connections: Math.floor(Math.random() * 100),
          completed: Math.floor(Math.random() * 60),
          pending: Math.floor(Math.random() * 40)
        }];

        const avgConnections = newData.slice(-5).reduce((acc, curr) => acc + curr.connections, 0) / 5;
        setStatus(avgConnections < 70 ? 'CRITICAL' : avgConnections < 80 ? 'SUBOPTIMAL' : 'NOMINAL');

        return newData;
      });
    }, 3000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const connections = payload[0].value;
      const status = connections < 70 ? 'CRITICAL' : connections < 80 ? 'WARNING' : 'OPTIMAL';
      const statusColor = connections < 70 ? '#ff0000' : connections < 80 ? '#ffaa00' : '#00ff00';
      
      return (
        <div className="custom-tooltip bg-black/90 border border-[#ff3a3a] p-3 rounded-lg backdrop-blur-sm">
          <p className="font-mono text-sm">TIME: <span className="text-blue-400">{label}</span></p>
          <p className="font-mono text-sm">CONNECTIONS: <span className="text-red-400">{connections}</span></p>
          <p className="font-mono text-sm">STATUS: <span style={{ color: statusColor }}>{status}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-col"
    >
      <GraphErrorBoundary>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="scanner-overlay"></div>
        </div>
        
        <div className="flex items-center justify-between p-4">
          <h3 className="text-red-500 text-sm uppercase font-mono relative z-10">Task Graph</h3>
          <motion.span 
            className={`text-sm font-mono ${
              status === 'CRITICAL' ? 'text-red-500' :
              status === 'SUBOPTIMAL' ? 'text-yellow-500' :
              'text-green-500'
            }`}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            STATUS: {status}
          </motion.span>
        </div>

        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
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
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 58, 58, 0.1)"
              />
              
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
                dataKey="connections"
                stroke="none"
                fill="url(#graphGradient)"
                fillOpacity={0.2}
              />
              
              {/* Main graph line */}
              <Line 
                type="monotone" 
                dataKey="connections"
                stroke="#FF3A3A"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                filter="url(#glow)"
              />
              
              {/* Critical points */}
              <Line
                type="monotone"
                dataKey={data.map(d => d.dependencies < 70 ? d.dependencies : null)}
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
      </GraphErrorBoundary>
    </div>
  );
};

export default TaskGraph;