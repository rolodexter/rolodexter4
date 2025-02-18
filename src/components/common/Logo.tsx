import { motion } from 'framer-motion';

export const Logo = () => {
  return (
    <motion.div 
      className="w-48 h-48 flex items-center justify-center -mb-12"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {/* Background square with border */}
        <div className="absolute inset-0 border border-white/20 bg-black/50" />
        
        {/* Main text with glow effect */}
        <motion.div 
          className="z-10 text-white text-8xl font-mono font-bold tracking-tighter"
          animate={{
            textShadow: [
              "0 0 20px rgba(255,255,255,0.5)",
              "0 0 30px rgba(255,255,255,0.7)",
              "0 0 20px rgba(255,255,255,0.5)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          R4
        </motion.div>

        {/* Scanline effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"
          animate={{
            y: ["0%", "100%", "0%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/50" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/50" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/50" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/50" />

        {/* Diagonal lines in corners */}
        <div className="absolute top-0 left-0 w-12 h-px bg-white/30 origin-top-left rotate-45" />
        <div className="absolute top-0 right-0 w-12 h-px bg-white/30 origin-top-right -rotate-45" />
        <div className="absolute bottom-0 left-0 w-12 h-px bg-white/30 origin-bottom-left -rotate-45" />
        <div className="absolute bottom-0 right-0 w-12 h-px bg-white/30 origin-bottom-right rotate-45" />
      </div>

      {/* Outer glow */}
      <div className="absolute -inset-4 bg-white/5 blur-lg" />
    </motion.div>
  );
}; 