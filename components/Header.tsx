import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCpu, FiActivity, FiUsers, FiShield, FiSearch, FiSettings, FiMenu, FiBell, FiMaximize, FiCode, FiSun, FiMoon, FiMonitor } from 'react-icons/fi'
import { useTheme } from 'next-themes'
import TimeDisplay from './TimeDisplay'

interface SystemMetric {
  icon: JSX.Element
  label: string
  value: string | number
  status: 'nominal' | 'warning' | 'critical'
}

const Header = () => {
  const [systemStatus, setSystemStatus] = useState('OPTIMAL')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const { theme, setTheme } = useTheme()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { icon: <FiUsers className="w-4 h-4" />, label: 'ACTIVE AGENTS', value: 42, status: 'nominal' },
    { icon: <FiActivity className="w-4 h-4" />, label: 'OPERATIONS', value: 156, status: 'nominal' },
    { icon: <FiCpu className="w-4 h-4" />, label: 'SYSTEM LOAD', value: '72%', status: 'warning' },
    { icon: <FiShield className="w-4 h-4" />, label: 'SECURITY', value: '98%', status: 'nominal' },
  ])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simulate metric updates with more realistic values
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        let newValue = metric.value;
        if (typeof metric.value === 'number') {
          newValue = Math.max(0, Math.min(100, (metric.value as number) + (Math.random() * 6 - 3)));
        } else if (metric.value.includes('%')) {
          const currentValue = parseInt(metric.value);
          newValue = Math.max(0, Math.min(100, currentValue + (Math.random() * 6 - 3))) + '%';
        }
        
        let status: 'nominal' | 'warning' | 'critical' = 'nominal';
        const numericValue = typeof newValue === 'number' ? newValue : parseInt(newValue);
        if (numericValue < 30) status = 'critical';
        else if (numericValue < 60) status = 'warning';
        
        return { ...metric, value: newValue, status };
      }));
      
      const criticalCount = metrics.filter(m => m.status === 'critical').length;
      const warningCount = metrics.filter(m => m.status === 'warning').length;
      setSystemStatus(
        criticalCount > 0 ? 'CRITICAL' :
        warningCount > 1 ? 'SUBOPTIMAL' :
        'OPTIMAL'
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [metrics]);

  const navigationLinks = [
    { href: '/dashboard', label: 'DASHBOARD' },
    { href: '/tasks', label: 'TASKS' },
    { href: '/agents', label: 'AGENTS' },
    { href: '/operations', label: 'OPERATIONS' }
  ]

  const themeOptions = [
    { icon: FiSun, label: 'LIGHT MODE', value: 'light' },
    { icon: FiMoon, label: 'DARK MODE', value: 'dark' },
    { icon: FiMonitor, label: 'SYSTEM', value: 'system' }
  ]

  const renderThemeIcon = () => {
    if (!mounted) return null // Prevent hydration mismatch
    
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
      {/* Enhanced Top Status Bar */}
      <div className="absolute top-0 left-0 w-full h-8 border-b border-red-500/30 flex items-center justify-between px-4 backdrop-blur-sm bg-gray-900/50">
        <div className="flex items-center space-x-4">
          <motion.div 
            className="status-indicator"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className="text-hud text-xs">SYS.4.2.1</span>
          <motion.div 
            className="h-4 w-px bg-red-500/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-hud text-xs">TACTICAL INTERFACE</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-hud text-xs">UPTIME:</span>
            <TimeDisplay />
          </div>
          <motion.div 
            className="flex items-center space-x-2"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-hud text-xs">STATUS:</span>
            <span className={`text-status text-xs ${
              systemStatus === 'CRITICAL' ? 'status-critical' :
              systemStatus === 'SUBOPTIMAL' ? 'status-warning' :
              'status-nominal'
            }`}>
              {systemStatus}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Enhanced Logo and Title */}
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
                <span className="text-xs text-gray-400">BUILD</span>
                <span className="text-xs text-red-500">2025.02.18</span>
              </div>
            </div>
          </motion.div>

          {/* Enhanced System Metrics */}
          <div className="flex-1 grid grid-cols-4 gap-4 mx-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                className="header-stat"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`text-${metric.status === 'nominal' ? 'green' : metric.status === 'warning' ? 'yellow' : 'red'}-500`}
                    >
                      {metric.icon}
                    </motion.div>
                    <span className="text-hud text-xs">{metric.label}</span>
                  </div>
                  <span className={`text-data text-sm ${
                    metric.status === 'warning' ? 'status-warning' :
                    metric.status === 'critical' ? 'status-critical' :
                    'status-nominal'
                  }`}>
                    {metric.value}
                  </span>
                </div>
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-red-500/30"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </div>

          {/* Enhanced Quick Actions */}
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

            {/* Theme Toggle Button */}
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
          </div>
        </div>
      </div>

      {/* Enhanced Quick Search Menu */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            className="absolute top-full left-0 w-full bg-gray-900/95 border border-red-500/30 backdrop-blur-md rounded-b-lg p-4 z-50"
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
            <div className="grid grid-cols-3 gap-4">
              <div className="text-hud text-sm">Recent Tasks</div>
              <div className="text-hud text-sm">Active Agents</div>
              <div className="text-hud text-sm">Quick Actions</div>
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

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanner-overlay opacity-30"></div>
        <div className="grid-overlay opacity-20"></div>
      </div>

      {/* Enhanced Corner Decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-red-500/50 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-red-500/50 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-red-500/50 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-red-500/50 animate-pulse"></div>
    </motion.header>
  )
}

export default Header