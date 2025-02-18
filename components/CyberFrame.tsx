import React from 'react';
import { motion } from 'framer-motion';

export const CyberFrame: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Killy-inspired geometric head wireframe */}
      <motion.svg
        className="absolute top-8 right-8 w-32 h-32"
        viewBox="0 0 100 100"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 1, 0],
          rotateY: [0, 180, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Head geometric shape */}
        <motion.path
          d="M20 50 L40 20 L60 20 L80 50 L60 80 L40 80 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* Eye socket */}
        <motion.circle
          cx="50"
          cy="45"
          r="5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.svg>

      {/* Silicon Life-inspired body frame */}
      <motion.svg
        className="absolute bottom-8 left-8 w-48 h-64"
        viewBox="0 0 100 160"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0, 1, 0],
          rotateX: [0, 15, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Torso frame */}
        <motion.path
          d="M30 40 L50 20 L70 40 L70 100 L50 120 L30 100 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {/* Circuit patterns */}
        <motion.path
          d="M50 20 L50 120 M30 70 L70 70 M40 50 L60 50 M40 90 L60 90"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.25"
          strokeDasharray="2,2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.svg>

      {/* Background circuit grid */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, #FFFFFF 1px, transparent 1px),
            linear-gradient(#FFFFFF 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.05
        }}
        animate={{
          backgroundPosition: ['0px 0px', '20px 20px']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent"
        style={{ opacity: 0.05 }}
        animate={{
          y: ['-100%', '100%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};