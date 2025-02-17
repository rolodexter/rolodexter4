import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Agents</h3>
            <ul className="space-y-2">
              <li><a href="/agents/JoeMaristela" className="hover:text-gray-300">Joe Maristela</a></li>
              <li><a href="/agents/rolodexterGPT" className="hover:text-gray-300">rolodexterGPT</a></li>
              <li><a href="/agents/rolodexterVS" className="hover:text-gray-300">rolodexterVS</a></li>
              <li><a href="/agents/VisualEngineer" className="hover:text-gray-300">Visual Engineer</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Projects</h3>
            <ul className="space-y-2">
              <li><a href="/projects/rolodexter-labs" className="hover:text-gray-300">Rolodexter Labs</a></li>
              <li><a href="/projects/research" className="hover:text-gray-300">Research</a></li>
              <li><a href="/projects/community" className="hover:text-gray-300">Community</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/operations" className="hover:text-gray-300">Operations</a></li>
              <li><a href="/api" className="hover:text-gray-300">API</a></li>
              <li><a href="https://github.com/rolodexter4" className="hover:text-gray-300">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p>&copy; {new Date().getFullYear()} rolodexter4. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;