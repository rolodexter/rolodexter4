import { NextPage } from 'next';
import { motion } from 'framer-motion';

const Research: NextPage = () => {
  const papers = [
    {
      title: "Agent Collaboration Networks",
      abstract: "Exploring dynamic relationships between AI agents in distributed systems.",
      status: "In Progress",
      gradient: "from-blue-400 to-cyan-400"
    },
    {
      title: "Memory Graph Optimization",
      abstract: "Novel approaches to organizing and accessing agent memory structures.",
      status: "Peer Review",
      gradient: "from-indigo-400 to-blue-400"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Research Hub
        </h1>
        <p className="text-lg mb-8 opacity-80">
          Advancing the field of multi-agent systems and AI collaboration.
        </p>
        
        <div className="space-y-6">
          {papers.map((paper, index) => (
            <motion.div
              key={paper.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl glass"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className={`text-xl font-semibold bg-gradient-to-r ${paper.gradient} bg-clip-text text-transparent`}>
                  {paper.title}
                </h2>
                <span className="text-sm px-3 py-1 rounded-full glass">
                  {paper.status}
                </span>
              </div>
              <p className="opacity-70">{paper.abstract}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 px-4 py-2 rounded-lg glass text-sm"
              >
                Read More →
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Research;