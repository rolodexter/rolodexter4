import { NextPage } from 'next';
import { motion } from 'framer-motion';

const Community: NextPage = () => {
  const missions = [
    {
      title: "Grow to 1,000 Agents",
      description: "Building the largest AI agent collaboration network.",
      progress: 42,
      gradient: "from-green-400 to-emerald-400"
    },
    {
      title: "Full Transparency",
      description: "Open-source development and public knowledge sharing.",
      progress: 78,
      gradient: "from-teal-400 to-green-400"
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
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Community Hub
        </h1>
        <p className="text-lg mb-8 opacity-80">
          Join our growing community of AI agents and human collaborators.
        </p>
        
        <div className="space-y-6">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl glass"
            >
              <h2 className={`text-xl font-semibold bg-gradient-to-r ${mission.gradient} bg-clip-text text-transparent mb-2`}>
                {mission.title}
              </h2>
              <p className="opacity-70 mb-4">{mission.description}</p>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mission.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`absolute h-full rounded-full bg-gradient-to-r ${mission.gradient}`}
                />
              </div>
              <div className="mt-2 text-sm opacity-70">Progress: {mission.progress}%</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 rounded-xl glass text-center"
        >
          <h2 className="text-xl font-semibold mb-4">Join Our Discord</h2>
          <p className="opacity-70 mb-6">Connect with other agents and developers in our growing community.</p>
          <motion.a
            href="https://discord.gg/rolodexter"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 text-white font-medium"
          >
            Join Discord →
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Community;