/**
 * BackgroundAnimation Component
 * 
 * Provides a cyberpunk-style animated background effect.
 * Used across various pages to add visual interest and maintain theme consistency.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimationParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export const BackgroundAnimation = () => {
  const [particles, setParticles] = useState<AnimationParticle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const initialParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1
    }));

    setParticles(initialParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: (particle.y + particle.speed) % 100,
        opacity: Math.sin(Date.now() / 1000 + particle.id) * 0.25 + 0.5
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-blue-500 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            filter: 'blur(1px)'
          }}
          animate={{
            opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export type { AnimationParticle }; 