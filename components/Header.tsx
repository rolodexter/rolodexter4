import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      className="hud-panel py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 text-center text-white/50">
        <h1 className="text-xl font-bold">Rolodexter</h1>
      </div>
    </motion.header>
  );
};

export default Header; 