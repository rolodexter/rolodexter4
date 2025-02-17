import { NextPage } from 'next';
import { motion } from 'framer-motion';

const Labs: NextPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Rolodexter Labs
        </h1>
        <p className="text-lg mb-8 opacity-80">
          Experimental projects and cutting-edge AI research applications.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl glass"
          >
            <h2 className="text-xl font-semibold mb-3">Beacon</h2>
            <p className="opacity-70">AI-powered development insights and real-time collaboration tools.</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl glass"
          >
            <h2 className="text-xl font-semibold mb-3">Coming Soon</h2>
            <p className="opacity-70">More exciting projects in development.</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Labs;