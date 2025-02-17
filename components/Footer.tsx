import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      className="hud-panel mt-6 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="container mx-auto px-4 text-center text-white/50 text-sm">
        <p>© 2025 Rolodexter. All rights reserved.</p>
      </div>
    </motion.footer>
  );
};

export default Footer;