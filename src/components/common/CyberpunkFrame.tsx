import { ReactNode } from 'react';

interface CyberpunkFrameProps {
  children: ReactNode;
  className?: string;
}

export const CyberpunkFrame = ({ children, className = '' }: CyberpunkFrameProps) => {
  return (
    <div className={`w-full text-black ${className}`}>
      <div className="relative p-4">
        <div className="relative border border-black">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}; 