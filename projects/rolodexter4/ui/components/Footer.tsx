import Link from 'next/link';
import { motion } from 'framer-motion';

const Footer = () => {
  const quickLinks = [
    { label: 'Documentation', href: '/docs', icon: '📚' },
    { label: 'Discord', href: 'https://discord.gg/rolodexter', icon: '💬' },
    { label: 'GitHub', href: 'https://github.com/rolodexter/r4', icon: '🔗' }
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 w-full bg-gray-900/80 backdrop-blur-md border-t border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Quick Access Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex space-x-4"
          >
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700"
              >
                <span>{link.icon}</span>
                <span className="text-sm text-gray-300">{link.label}</span>
              </Link>
            ))}
          </motion.div>

          {/* Copyright & API Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-400 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4"
          >
            <span>© {year} Rolodexter Labs</span>
            <Link 
              href="/api-reference"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              API Reference
            </Link>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;