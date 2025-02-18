import { ReactNode } from 'react';

interface CyberpunkFrameProps {
  children: ReactNode;
  className?: string;
}

export const CyberpunkFrame = ({ children, className = '' }: CyberpunkFrameProps) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Main Frame */}
      <div className="relative bg-black/90 p-1">
        {/* Outer Frame with Clipped Corners */}
        <div className="relative border border-white/20 bg-black/80"
          style={{
            clipPath: 'polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px))',
          }}>
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30" />

          {/* Inner Content Container */}
          <div className="relative bg-black/60 p-4">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent animate-scan" />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 grid-overlay opacity-20" />
            
            {/* Content */}
            <div className="relative z-10">
              {children}
            </div>

            {/* Inner Border Glow */}
            <div className="absolute inset-0 border border-cyan-500/10" 
              style={{
                boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.15)'
              }}
            />
          </div>
        </div>

        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-cyan-500/5 blur-sm -z-10" />
      </div>
    </div>
  );
}; 