import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      setTime(formattedTime);
    };

    // Initial update
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="text-xs font-mono text-gray-300 tracking-wider"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span suppressHydrationWarning>{time}</span>
    </motion.div>
  );
};

export default TimeDisplay;