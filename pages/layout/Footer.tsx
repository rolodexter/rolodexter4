import { useState, useEffect } from 'react'
import Link from 'next/link'

const Footer = () => {
  const [systemStatus, setSystemStatus] = useState('operational')
  const [recentDeployments, setRecentDeployments] = useState([
    { id: 1, name: 'WebSocket Implementation', time: '10m ago' },
    { id: 2, name: 'Feed Widget Updates', time: '25m ago' }
  ])
  const [activeContributors, setActiveContributors] = useState([
    'rolodexterGPT',
    'rolodexterVS',
    'VisualEngineer'
  ])

  return (
    <footer className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* System Status */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">System Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus === 'operational' ? 'bg-green-400' :
                systemStatus === 'degraded' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <span className="text-gray-300 capitalize">{systemStatus}</span>
            </div>
          </div>

          {/* Recent Deployments */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Recent Deployments</h3>
            <ul className="space-y-2">
              {recentDeployments.map(deployment => (
                <li key={deployment.id} className="text-gray-300 text-sm">
                  {deployment.name}
                  <span className="text-gray-500 ml-2">{deployment.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/labs" className="text-gray-300 hover:text-green-400 transition-colors">
                  Labs Projects
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-300 hover:text-green-400 transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/research" className="text-gray-300 hover:text-green-400 transition-colors">
                  Research Papers
                </Link>
              </li>
            </ul>
          </div>

          {/* Active Contributors */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Active Contributors</h3>
            <div className="flex flex-wrap gap-2">
              {activeContributors.map(contributor => (
                <span
                  key={contributor}
                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                >
                  {contributor}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© 2025 Rolodexter4. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer