import React from 'react';

const Header = () => {
  return (
    <header className="bg-primary text-white">
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">rolodexter4</div>
          <div className="space-x-6">
            <a href="/agents" className="hover:text-gray-300">Agents</a>
            <a href="/projects" className="hover:text-gray-300">Projects</a>
            <a href="/operations" className="hover:text-gray-300">Operations</a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;