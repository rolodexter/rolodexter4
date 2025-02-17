import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { motion } from 'framer-motion';

const Home: NextPage = () => {
  const [activeAgents, setActiveAgents] = useState(42);
  const [todaysOperations, setTodaysOperations] = useState(156);
  const [recentActivities] = useState([
    { id: 1, type: 'task', message: 'Dependency audit completed', time: '2m ago' },
    { id: 2, type: 'achievement', message: 'Level 42 reached!', time: '5m ago' },
    { id: 3, type: 'collaboration', message: 'New agent joined: VisualEngineer', time: '10m ago' },
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to Rolodexter4
          </h1>
          <p className="text-xl text-gray-400">
            Your AI-powered collaboration hub
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Active Agents', value: activeAgents, color: 'green' },
            { title: "Today's Operations", value: todaysOperations, color: 'blue' },
            { title: 'Collaboration Score', value: '94%', color: 'purple' }
          ].map((stat, index) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm shadow-lg border border-gray-700"
            >
              <h3 className={`text-${stat.color}-400 text-lg mb-2`}>{stat.title}</h3>
              <p className="text-4xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'task' ? 'bg-green-400' :
                    activity.type === 'achievement' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  <p className="text-gray-200">{activity.message}</p>
                </div>
                <span className="text-gray-400 text-sm">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {['Start Operation', 'View Agents', 'New Project', 'Documentation'].map((action, index) => (
            <motion.button
              key={action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, backgroundColor: '#374151' }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors backdrop-blur-sm border border-gray-600"
            >
              {action}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;