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
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Only initialize data if not already mounted
    if (!isMountedRef.current) {
      console.log('TaskVolumeChart mounted');
      isMountedRef.current = true;
      
      // Enhanced dimension logging
      const logDimensions = () => {
        if (containerRef.current) {
          const { offsetWidth, offsetHeight } = containerRef.current;
          const computedStyle = window.getComputedStyle(containerRef.current);
          
          console.log('Container dimensions:', {
            offset: { width: offsetWidth, height: offsetHeight },
            client: { 
              width: containerRef.current.clientWidth, 
              height: containerRef.current.clientHeight 
            },
            computed: {
              width: computedStyle.width,
              height: computedStyle.height,
              padding: computedStyle.padding,
              margin: computedStyle.margin
            }
          });
          
          setDimensions({ width: offsetWidth, height: offsetHeight });
        }
      };

      // Log initial dimensions
      logDimensions();

      // Enhanced resize observer
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          console.log('Container resized:', {
            width,
            height,
            aspectRatio: width / height
          });
          setDimensions({ width, height });
        }
        logDimensions();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
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

      return () => {
        clearInterval(interval);
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    }
  }, []);

  // Debug log when data changes
  useEffect(() => {
    console.log('Chart data updated:', data);
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className="hud-panel relative w-full h-full flex flex-col overflow-hidden"
      style={{ minHeight: '400px' }}
    >
      {/* Scanline Effect */}
      <div className="scanline"></div>

      {/* Debug Overlay - Only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-50 bg-black/80 p-2 text-xs text-hud pointer-events-none">
          <div>Container: {dimensions.width.toFixed(0)}x{dimensions.height.toFixed(0)}</div>
          <div>Aspect: {(dimensions.width / dimensions.height).toFixed(2)}</div>
          <div>Data Points: {data.length}</div>
        </div>
      )}

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
      <div className="flex-1 flex flex-col min-h-0 gap-4 relative z-10 p-4">
        {/* Main Performance Chart */}
        <div className="flex-1 min-h-0 relative bg-gray-900/20 rounded-lg border border-red-500/20 backdrop-blur-sm" style={{ height: 'calc(100% - 96px)' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <ComposedChart 
                data={data} 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E0E0E0" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#E0E0E0" stopOpacity={0.1}/>
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
                  stroke="rgba(48, 48, 48, 0.2)"
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
                  stroke="#404040"
                  tick={{ 
                    fill: '#A0A0A0', 
                    fontSize: 12,
                    fontFamily: 'var(--font-tactical)',
                    letterSpacing: '0.05em'
                  }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={{ stroke: '#404040' }}
                />
                <YAxis 
                  stroke="#404040"
                  tick={{ 
                    fill: '#A0A0A0', 
                    fontSize: 12,
                    fontFamily: 'var(--font-tactical)',
                    letterSpacing: '0.05em'
                  }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={{ stroke: '#404040' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={CustomTooltip}
                  cursor={{ stroke: '#404040' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 16, 16, 0.95)',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-tactical)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                />
                
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#E0E0E0"
                  strokeWidth={2}
                  fill="url(#completionGradient)"
                  name="completion"
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone"
                  dataKey="completion"
                  stroke="#E0E0E0"
                  strokeWidth={2}
                  dot={false}
                  name="completion"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-500 font-mono">No Data Available</span>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        <div className="h-24 relative bg-gray-900/20 rounded-lg border border-red-500/20 backdrop-blur-sm">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                margin={{ top: 10, right: 20, bottom: 0, left: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(48, 48, 48, 0.2)"
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
                  stroke="#404040"
                  tick={{ fill: '#A0A0A0', fontSize: 12 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={{ stroke: '#404040' }}
                />
                <YAxis 
                  stroke="#404040"
                  tick={{ fill: '#A0A0A0', fontSize: 12 }}
                  axisLine={{ stroke: '#404040' }}
                  tickLine={{ stroke: '#404040' }}
                />
                <Tooltip 
                  content={CustomTooltip}
                  cursor={{ fill: 'rgba(48, 48, 48, 0.1)' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 16, 16, 0.95)',
                    border: '1px solid var(--border-color)'
                  }}
                />
                
                <Bar 
                  dataKey="completed" 
                  stackId="a" 
                  fill="#E0E0E0" 
                  fillOpacity={0.8}
                  name="completed" 
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="pending" 
                  stackId="a" 
                  fill="#FF2C2C" 
                  fillOpacity={0.8}
                  name="pending" 
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-500 font-mono">No Data Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent"></div>
        <div className="scanner-overlay"></div>
        <div className="grid-overlay"></div>
        
        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/30"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/30"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/30"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/30"></div>
      </div>
    </div>
  );
};

export default TaskVolumeChart; 