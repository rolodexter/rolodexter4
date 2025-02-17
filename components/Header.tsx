import { motion } from 'framer-motion'

const Header = () => {
  return (
    <motion.header 
      className="hud-panel relative mb-6 overflow-visible h-32"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-start h-full px-10">
        {/* Logo */}
        <motion.div 
          className="flex items-center scale-150 origin-left"
          whileHover={{ scale: 1.6, x: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-display text-8xl font-black text-white tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] hover:text-primary-400 transition-all duration-300 hover:drop-shadow-[0_0_35px_rgba(255,255,255,1)]">
            R4
          </div>
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-white/20 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-white/20 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-white/20 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-white/20 rounded-br-lg"></div>
    </motion.header>
  )
}

export default Header