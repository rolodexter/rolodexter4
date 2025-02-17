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
    console.log('Initial render - Container ref:', containerRef.current);
    
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      console.log('Container dimensions on mount:', {
        width: offsetWidth,
        height: offsetHeight,
        style: window.getComputedStyle(containerRef.current)
      });
    }

    // Initialize with mock data
    const initialData = generateMockData(20);
    console.log('Initial chart data:', initialData);
    setData(initialData);

    // Add resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        console.log('Container resized:', {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

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

    return () => {
      clearInterval(interval);
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
      className="hud-panel relative overflow-visible bg-gray-900/90 border-2 border-red-500/30"
      style={{ 
        height: '100%',
        minHeight: '400px',
        zIndex: 10,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        visibility: 'visible'
      }}
    >
      {/* Debug info with more details */}
      <div className="absolute top-2 right-2 z-50 bg-black/80 p-2 text-xs font-mono text-red-500">
        <div>Data points: {data.length}</div>
        <div>Width: {containerRef.current?.offsetWidth || 0}px</div>
        <div>Height: {containerRef.current?.offsetHeight || 0}px</div>
        <div>Data valid: {Boolean(data && data.length > 0).toString()}</div>
      </div>

      {/* Header with Status */}
      <div className="flex items-center justify-between p-4 mb-2" style={{ zIndex: 20 }}>
        <h3 className="text-red-500 text-sm uppercase font-mono">Task Volume Analysis</h3>
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

      {/* Chart Container with debug styles */}
      <div className="flex flex-col flex-grow h-full p-4 chart-debug" style={{ minHeight: 0, position: 'relative', zIndex: 20 }}>
        {/* Main Performance Chart */}
        <div className="flex-grow mb-4 bg-gray-900/50 p-2 rounded-lg border border-red-500/20" 
          style={{ 
            minHeight: 0, 
            height: 'calc(100% - 140px)',
            border: '2px solid yellow',
            position: 'relative',
            zIndex: 25
          }}
        >
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} debounce={50}>
              <ComposedChart 
                data={data} 
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                style={{ visibility: 'visible', zIndex: 30 }}
              >
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3a3a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff3a3a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 58, 58, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  height={30}
                />
                <YAxis 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  width={40}
                  domain={[0, 100]}
                />
                <Tooltip content={CustomTooltip} />
                <Legend wrapperStyle={{ position: 'relative', marginTop: '10px' }}/>
                
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#ff3a3a"
                  fill="url(#completionGradient)"
                  name="completion"
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone"
                  dataKey="completion"
                  stroke="#ff3a3a"
                  strokeWidth={2}
                  dot={false}
                  name="completion"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border-2 border-red-500">
              <span className="text-red-500 font-mono">No Data Available</span>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        <div className="h-[120px] bg-gray-900/50 p-2 rounded-lg border-2 border-blue-500" style={{ position: 'relative', zIndex: 25 }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={100} debounce={50}>
              <BarChart 
                data={data} 
                margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                style={{ visibility: 'visible', zIndex: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 58, 58, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  height={30}
                />
                <YAxis 
                  stroke="#4B5563"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  width={40}
                />
                <Tooltip content={CustomTooltip} />
                <Legend wrapperStyle={{ position: 'relative', marginTop: '5px' }}/>
                
                <Bar dataKey="completed" stackId="a" fill="#4ade80" name="completed" isAnimationActive={false} />
                <Bar dataKey="pending" stackId="a" fill="#ff3a3a" name="pending" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border-2 border-red-500">
              <span className="text-red-500 font-mono">No Data Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Move overlays after the charts */}
      <div className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 5 }}>
        <div className="scanner-overlay"></div>
        <div className="grid-overlay"></div>
      </div>
    </div>
  );
};

export default TaskVolumeChart; 