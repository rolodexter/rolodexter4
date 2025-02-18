/**
 * BackgroundAnimation Component
 * 
 * Provides a cyberpunk-style animated background effect.
 * Used across various pages to add visual interest and maintain theme consistency.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useEffect, useState, useCallback } from 'react';
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

  const updateParticles = useCallback((timestamp: number) => {
    setParticles(prev => prev.map(particle => ({
      ...particle,
      y: (particle.y + particle.speed) % 100,
      opacity: Math.sin(timestamp / 1000 + particle.id) * 0.15 + 0.25
    })));
  }, []);

  useEffect(() => {
    // Generate initial particles
    const initialParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2, // Slower movement
      opacity: Math.random() * 0.3 + 0.1
    }));

    setParticles(initialParticles);

    let animationFrameId: number;
    let lastUpdate = 0;
    const fps = 30; // Limit to 30 FPS
    const interval = 1000 / fps;

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate >= interval) {
        updateParticles(timestamp);
        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [updateParticles]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            filter: 'blur(1px)',
            willChange: 'transform, opacity'
          }}
          animate={{
            opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
            scale: [1, 1.1, 1]
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