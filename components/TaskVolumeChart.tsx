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
  Legend
} from 'recharts';

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
      <div className="custom-tooltip bg-black/90 border border-[#ff3a3a] p-3 rounded-lg backdrop-blur-sm">
        <p className="font-mono text-sm">TIME: <span className="text-blue-400">{label}</span></p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-mono text-sm">
            {entry.name.toUpperCase()}: <span style={{ color: entry.color }}>{entry.value}</span>
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

  useEffect(() => {
    console.log('TaskVolumeChart mounted');
    if (containerRef.current) {
      console.log('Container dimensions:', {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }

    // Initialize with mock data
    const initialData = generateMockData(20);
    console.log('Initial chart data:', initialData);
    setData(initialData);

    // Update data periodically
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1), {
          time: `${prevData.length}m`,
          completion: Math.floor(Math.random() * 40) + 60,
          volume: Math.floor(Math.random() * 100),
          completed: Math.floor(Math.random() * 60),
          pending: Math.floor(Math.random() * 40)
        }];

        // Update status based on recent performance
        const avgCompletion = newData.slice(-5).reduce((acc, curr) => acc + curr.completion, 0) / 5;
        setStatus(avgCompletion < 70 ? 'CRITICAL' : avgCompletion < 80 ? 'SUBOPTIMAL' : 'NOMINAL');

        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Debug log when data changes
  useEffect(() => {
    console.log('Chart data updated:', data);
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className="hud-panel relative overflow-hidden bg-gray-900/90 border-2 border-red-500/30"
      style={{ 
        height: '100%',
        minHeight: '400px',
        zIndex: 10,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Debug info with more details */}
      <div className="absolute top-2 right-2 z-50 bg-black/80 p-2 text-xs font-mono text-red-500">
        <div>Data points: {data.length}</div>
        <div>Width: {containerRef.current?.offsetWidth || 0}px</div>
        <div>Height: {containerRef.current?.offsetHeight || 0}px</div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full">
        <div className="scanner-overlay"></div>
      </div>
      
      {/* Header with Status */}
      <div className="flex items-center justify-between p-4 mb-2">
        <h3 className="text-red-500 text-sm uppercase font-mono relative z-10">Task Volume Analysis</h3>
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

      {/* Chart Container with explicit dimensions */}
      <div className="flex flex-col flex-grow h-full p-4" style={{ minHeight: 0 }}>
        {/* Main Performance Chart */}
        <div className="flex-grow mb-4 bg-gray-900/50 p-2 rounded-lg border border-red-500/20" style={{ minHeight: 0 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3a3a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff3a3a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="time" 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={CustomTooltip} />
                <Legend />
                
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#ff3a3a"
                  fill="url(#completionGradient)"
                  name="completion"
                />
                <Line 
                  type="monotone"
                  dataKey="completion"
                  stroke="#ff3a3a"
                  strokeWidth={2}
                  dot={false}
                  name="completion"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-500 font-mono">Loading chart data...</span>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        <div className="h-[120px] bg-gray-900/50 p-2 rounded-lg border border-red-500/20">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="time" 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                />
                <Tooltip content={CustomTooltip} />
                <Legend />
                
                <Bar dataKey="completed" stackId="a" fill="#4ade80" name="completed" />
                <Bar dataKey="pending" stackId="a" fill="#ff3a3a" name="pending" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-500 font-mono">Loading chart data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid overlay effect */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="grid-overlay"></div>
      </div>
    </div>
  );
};

export default TaskVolumeChart; 