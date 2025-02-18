import React from 'react';
import { motion } from 'framer-motion';

export const CyborgFrame: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
      <motion.svg
        viewBox="0 0 100 120"
        className="w-[80vh] h-[80vh] opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {/* Base head hexagon */}
        <motion.path
          d="M30 60 L40 30 L60 30 L70 60 L60 90 L40 90 Z"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />

        {/* Inner face details */}
        <motion.path
          d="M40 45 L60 45 L55 75 L45 75 Z M42 55 L58 55"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: 1
          }}
        />

        {/* Scanning eye */}
        <motion.circle
          cx="50"
          cy="55"
          r="3"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1, 1, 0],
            strokeWidth: [0.5, 0.5, 2, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            times: [0, 0.3, 0.7, 1]
          }}
        />

        {/* Eye scan lines */}
        <motion.path
          d="M47 55 L38 55 M53 55 L62 55"
          stroke="white"
          strokeWidth="0.25"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            times: [0, 0.3, 0.7, 1]
          }}
        />

        {/* Neck structure with more detail */}
        <motion.path
          d="M40 90 L45 110 L55 110 L60 90 M42 95 L58 95 M44 100 L56 100 M46 105 L54 105"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: 0.5
          }}
        />

        {/* Shoulders with geometric patterns */}
        <motion.path
          d="M45 110 L20 115 M55 110 L80 115 M25 113 L35 112 M65 112 L75 113"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: 1
          }}
        />

        {/* Circuit patterns */}
        <motion.path
          d="M30 60 L20 60 M70 60 L80 60 M45 35 L55 35 M45 85 L55 85"
          fill="none"
          stroke="white"
          strokeWidth="0.25"
          strokeDasharray="1,2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />

        {/* Additional geometric details */}
        <motion.path
          d="M35 45 L35 75 M65 45 L65 75"
          fill="none"
          stroke="white"
          strokeWidth="0.25"
          strokeDasharray="2,2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: 2
          }}
        />

        {/* Vertical scan line */}
        <motion.line
          x1="30"
          y1="0"
          x2="70"
          y2="0"
          stroke="white"
          strokeWidth="0.25"
          strokeDasharray="1,3"
          initial={{ y1: 30, y2: 30 }}
          animate={{ y1: 90, y2: 90 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />

        {/* Data flow lines */}
        <motion.path
          d="M25 40 L35 40 M65 40 L75 40 M25 80 L35 80 M65 80 L75 80"
          stroke="white"
          strokeWidth="0.25"
          strokeDasharray="1,2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0.3, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />
      </motion.svg>
    </div>
  );
};