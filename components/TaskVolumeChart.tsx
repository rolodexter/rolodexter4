import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
  CartesianGrid
} from 'recharts';
import React from 'react';

class ChartErrorBoundary extends React.Component<
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
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-red-500 font-mono">Chart Error - Reloading...</span>
        </div>
      );
    }

    return this.props.children;
  }
}

interface TaskData {
  time: string;
  completion: number;
  volume: number;
  pending: number;
  completed: number;
}

const generateMockData = (count: number): TaskData[] => {
  return Array.from({ length: count }, (_, i) => {
    const completion = Math.floor(Math.random() * 40) + 60;
    const volume = Math.floor(Math.random() * 100);
    const completed = Math.floor(volume * (completion / 100));
    const pending = volume - completed;
    
    return {
      time: `${i}m`,
      completion,
      volume,
      completed,
      pending
    };
  });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-hud mb-2">Time: <span className="text-data">{label}</span></p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-hud flex justify-between items-center gap-4">
            <span>{entry.name}:</span>
            <span className="text-data">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TaskVolumeChart = () => {
  const [data, setData] = useState<TaskData[]>([]);
  const [status, setStatus] = useState('NOMINAL');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let mounted = true;
    console.log('TaskVolumeChart mounted');

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
          completion: Math.floor(Math.random() * 40) + 60,
          volume: Math.floor(Math.random() * 100),
          completed: Math.floor(Math.random() * 60),
          pending: Math.floor(Math.random() * 40)
        }];

        const avgCompletion = newData.slice(-5).reduce((acc, curr) => acc + curr.completion, 0) / 5;
        setStatus(avgCompletion < 70 ? 'CRITICAL' : avgCompletion < 80 ? 'SUBOPTIMAL' : 'NOMINAL');

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

  // Debug log when data changes
  useEffect(() => {
    console.log('Chart data updated:', data);
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className="performance-chart"
      style={{ minHeight: '400px' }}
    >
      <ChartErrorBoundary>
        {/* Status Overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-4">
          <motion.span 
            className={`text-status ${
              status === 'CRITICAL' ? 'status-critical' :
              status === 'SUBOPTIMAL' ? 'status-warning' :
              'status-nominal'
            }`}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            STATUS: {status}
          </motion.span>
        </div>

        {/* Chart Container */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10 p-4">
          {/* Main Performance Chart */}
          <div className="flex-1 min-h-0 relative backdrop-blur-sm" style={{ height: '100%' }}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <ComposedChart 
                  data={data} 
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <defs>
                    <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(255, 255, 255, 0.05)"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke="#404040"
                    tick={{ 
                      fill: '#808080', 
                      fontSize: 10,
                      fontFamily: 'var(--font-tactical)',
                      letterSpacing: '0.05em'
                    }}
                    axisLine={{ stroke: '#404040' }}
                    tickLine={{ stroke: '#404040' }}
                  />
                  <YAxis 
                    stroke="#404040"
                    tick={{ 
                      fill: '#808080', 
                      fontSize: 10,
                      fontFamily: 'var(--font-tactical)',
                      letterSpacing: '0.05em'
                    }}
                    axisLine={{ stroke: '#404040' }}
                    tickLine={{ stroke: '#404040' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={CustomTooltip}
                    cursor={{ stroke: '#FFFFFF', strokeOpacity: 0.1 }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontFamily: 'var(--font-tactical)',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                      color: '#808080'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                    fillOpacity={1}
                    fill="url(#completionGradient)"
                  />
                  <Bar 
                    dataKey="volume" 
                    fill="#FFFFFF"
                    fillOpacity={0.1}
                    stroke="#FFFFFF"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-white/50 font-mono text-sm">Loading data...</span>
              </div>
            )}
          </div>
        </div>
      </ChartErrorBoundary>
    </div>
  );
};

export default TaskVolumeChart;