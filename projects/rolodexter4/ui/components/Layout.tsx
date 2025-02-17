import React from 'react';
import { useTheme } from 'next-themes';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Global Layout Component
 * @description Wraps all pages with standardized header and footer
 * @initialization Follows the new-thread-operation procedure
 */
const Layout = ({ children }: LayoutProps) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none" />
      <Header />
      <main className="relative pt-16 pb-20">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;