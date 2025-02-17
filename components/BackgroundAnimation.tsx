import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface Platform {
  id: number;
  left: string;
  top: string;
}

const BackgroundAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isEnabled, setIsEnabled] = useState(true);
  const [perspective, setPerspective] = useState({ rotateX: 60, translateZ: -100 });
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 5;
    setMousePosition({ x, y });
    setPerspective({
      rotateX: 60 + y,
      translateZ: -100 + Math.abs(x) * 2
    });
  }, []);

  useEffect(() => {
    // Initialize platforms with stable positions
    setPlatforms(Array.from({ length: 8 }, (_, index) => ({
      id: index,
      left: `${10 + (index * 10)}%`,
      top: `${20 + (index * 5)}%`
    })));

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Perspective Grid Layer */}
      <motion.div 
        className="absolute inset-0 tron-grid"
        style={{
          perspective: '800px',
          perspectiveOrigin: '50% 50%'
        }}
        animate={{
          x: mousePosition.x,
          y: mousePosition.y
        }}
        transition={{
          type: "spring",
          stiffness: 30,
          damping: 20
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            rotateX: perspective.rotateX,
            translateZ: perspective.translateZ
          }}
          transition={{
            type: "spring",
            stiffness: 30,
            damping: 20
          }}
        >
          <div className="grid-pattern" />
        </motion.div>
      </motion.div>

      {/* Horizon Glow */}
      <div className="absolute inset-0 horizon-glow" />

      {/* Light Beams */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={`beam-${index}`}
            className="light-beam"
            style={{
              left: `${(index + 1) * 20}%`,
              opacity: 0
            }}
            animate={{
              opacity: [0, 0.05, 0],
              height: ['0%', '100%', '0%']
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: index * 0.8,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating Platforms */}
      <div className="absolute inset-0 pointer-events-none">
        {platforms.map((platform) => (
          <motion.div
            key={`platform-${platform.id}`}
            className="floating-platform"
            style={{
              left: platform.left,
              top: platform.top
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 3 + (platform.id % 2),
              repeat: Infinity,
              delay: platform.id * 0.3
            }}
          />
        ))}
      </div>

      {/* Debug Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <button
          className="fixed bottom-4 left-4 px-4 py-2 bg-gray-900/80 text-white text-sm rounded-md backdrop-blur-sm border border-gray-500/30 z-50"
          onClick={() => setIsEnabled(!isEnabled)}
        >
          Toggle Background
        </button>
      )}
    </div>
  );
};

export default BackgroundAnimation; 