import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setTime(new Date().toISOString().slice(11, 19));
    };

    // Initial update
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render anything until mounted (client-side only)
  if (!mounted) return null;

  return (
    <motion.span
      className="text-xs font-mono text-white tracking-wider"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      suppressHydrationWarning
    >
      {time}
    </motion.span>
  );
};

export default TimeDisplay;