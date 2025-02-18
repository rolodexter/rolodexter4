import React, { useState, useRef, ReactNode } from 'react';

interface WindowPanelProps {
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
}

export default function WindowPanel({ 
  title, 
  children, 
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 600, height: 400 }
}: WindowPanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === panelRef.current) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStart.current = {
      x: e.clientX - size.width,
      y: e.clientY - size.height
    };
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      setSize({
        width: Math.max(300, e.clientX - dragStart.current.x),
        height: Math.max(200, e.clientY - dragStart.current.y)
      });
    }
  };

  return (
    <div
      ref={panelRef}
      className={`fixed bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 200 : size.width,
        height: isMinimized ? 40 : size.height,
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleResizeMouseMove(e);
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Window header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
          >
            {isMinimized ? '□' : '−'}
          </button>
        </div>
      </div>

      {/* Window content */}
      {!isMinimized && (
        <div className="relative h-[calc(100%-40px)]">
          {children}
          
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
            >
              <path d="M11 11v4h4v-4h-4zm1 1h2v2h-2v-2z" />
              <path d="M7 11v4h3v-4h-3zm1 1h1v2h-1v-2z" />
              <path d="M3 11v4h3v-4h-3zm1 1h1v2h-1v-2z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
} 