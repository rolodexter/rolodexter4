import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';

const Header = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Labs', href: '/labs', gradient: 'from-purple-400 to-pink-400' },
    { label: 'Research', href: '/research', gradient: 'from-blue-400 to-cyan-400' },
    { label: 'Community', href: '/community', gradient: 'from-green-400 to-emerald-400' }
  ];

  const ThemeToggle = () => {
    const themes = [
      { value: 'dark', icon: '🌙' },
      { value: 'light', icon: '☀️' },
      { value: 'system', icon: '💻' }
    ];

    if (!mounted) return null;

    return (
      <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1 backdrop-blur-sm">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`p-2 rounded-md transition-all duration-200 ${
              theme === t.value 
                ? 'bg-gray-700 shadow-lg scale-105' 
                : 'hover:bg-gray-700/50'
            }`}
            aria-label={`Switch to ${t.value} theme`}
          >
            <span className="text-sm">{t.icon}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-700 z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
              R4
            </Link>
          </motion.div>

          {/* Main Navigation */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative group"
              >
                <span className={`text-sm font-medium bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent
                  transition-all duration-300 ${
                    router.pathname.startsWith(item.href) 
                      ? 'opacity-100 scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}>
                  {item.label}
                </span>
                {router.pathname.startsWith(item.href) && (
                  <motion.div
                    layoutId="navIndicator"
                    className={`absolute -bottom-3.5 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`}
                    initial={false}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;