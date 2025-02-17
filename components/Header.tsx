import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiSettings, FiBell, FiSun, FiMoon, FiMonitor, FiCode, FiPackage, FiUsers, FiServer } from 'react-icons/fi'
import { useTheme } from 'next-themes'
import TimeDisplay from './TimeDisplay'

const Header = () => {
  const [mounted, setMounted] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigationLinks = [
    { href: '/labs', label: 'LABS', icon: FiCode, description: 'Experimental Features & Research' },
    { href: '/products', label: 'PRODUCTS', icon: FiPackage, description: 'Our Digital Solutions' },
    { href: '/services', label: 'SERVICES', icon: FiServer, description: 'Professional Services' },
    { href: '/community', label: 'COMMUNITY', icon: FiUsers, description: 'Join Our Network' }
  ]

  const themeOptions = [
    { icon: FiSun, label: 'LIGHT MODE', value: 'light' },
    { icon: FiMoon, label: 'DARK MODE', value: 'dark' },
    { icon: FiMonitor, label: 'SYSTEM', value: 'system' }
  ]

  const renderThemeIcon = () => {
    if (!mounted) return null
    
    if (theme === 'light') {
      return <FiSun className="w-5 h-5 text-red-400" />
    } else if (theme === 'dark') {
      return <FiMoon className="w-5 h-5 text-red-400" />
    } else {
      return <FiMonitor className="w-5 h-5 text-red-400" />
    }
  }

  return (
    <motion.header 
      className="hud-panel relative mb-6 overflow-visible"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <motion.div 
          className="flex items-center space-x-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 relative">
            <motion.div 
              className="absolute inset-0 bg-red-500/20 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-2 bg-red-500/40 rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-4 bg-red-500/60 rounded-full"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-display text-2xl mb-1">
              ROLODEXTER<span className="text-red-500">4</span>
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">VERSION</span>
              <span className="text-xs text-red-500">2025.02</span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Links */}
        <nav className="flex-1 flex justify-center space-x-8">
          {navigationLinks.map((link) => (
            <Link 
              key={link.label}
              href={link.href}
              className={`group relative py-2 px-4 ${
                router.pathname === link.href 
                  ? 'text-red-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <motion.span
                className="relative z-10 flex items-center space-x-2 font-mono text-sm"
                whileHover={{ x: 5 }}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </motion.span>
              {router.pathname === link.href && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-red-500/10 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="absolute left-0 -bottom-8 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-xs text-gray-500 font-mono">{link.description}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center space-x-4">
          <motion.button
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickMenu(!showQuickMenu)}
          >
            <FiSearch className="w-5 h-5 text-red-400" />
            <motion.div 
              className="absolute inset-0 border border-red-500/30 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          <motion.button
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiBell className="w-5 h-5 text-red-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            <motion.div 
              className="absolute inset-0 border border-red-500/30 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
          >
            {renderThemeIcon()}
            <motion.div 
              className="absolute inset-0 border border-red-500/30 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          <motion.button
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings className="w-5 h-5 text-red-400" />
            <motion.div 
              className="absolute inset-0 border border-red-500/30 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          <TimeDisplay />
        </div>
      </div>

      {/* Quick Search Menu */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            className="absolute top-full left-0 w-full bg-gray-900/95 border border-red-500/30 backdrop-blur-md rounded-lg p-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <FiSearch className="w-5 h-5 text-red-400" />
              <input
                type="text"
                placeholder="QUICK SEARCH..."
                className="bg-transparent border-b border-red-500/30 focus:border-red-400 outline-none w-full text-tactical placeholder-gray-500"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <link.icon className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-mono">{link.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{link.description}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Selection Menu */}
      <AnimatePresence>
        {showThemeMenu && (
          <motion.div
            className="absolute top-full right-0 w-64 bg-gray-900/95 border border-red-500/30 backdrop-blur-md rounded-lg p-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="text-hud text-sm mb-3">INTERFACE MODE</h3>
            <div className="space-y-2">
              {themeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    theme === option.value ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => {
                    setTheme(option.value)
                    setShowThemeMenu(false)
                  }}
                  whileHover={{ x: 5 }}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm">{option.label}</span>
                  {theme === option.value && (
                    <motion.div
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"
                      layoutId="activeTheme"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/50 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/50 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/50 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/50 rounded-br-lg"></div>
    </motion.header>
  )
}

export default Header