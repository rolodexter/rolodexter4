/**
 * Header Component
 * 
 * Main navigation header for the application.
 * Used across all pages for consistent navigation.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            ROLODEXTER<span className="text-blue-500">4</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/tasks" className="text-gray-300 hover:text-white">Tasks</Link>
            <Link href="/documents" className="text-gray-300 hover:text-white">Documents</Link>
            <Link href="/agents" className="text-gray-300 hover:text-white">Agents</Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export { Header }; 