import React, { ReactNode } from 'react';
import Header from '../../projects/rolodexter4/ui/components/Header';
import Footer from '../../projects/rolodexter4/ui/components/Footer';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Global Layout Component
 * @description Wraps all pages with standardized header and footer
 * @initialization Follows the new-thread-operation procedure defined in /agents/rolodexterVS/operations/new-thread-operation.html
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;