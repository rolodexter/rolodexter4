/**
 * Footer Component
 * 
 * Site-wide footer component with links and copyright information.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

export const Footer = () => {
  return (
    <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            © 2024 Rolodexter4. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a href="/docs" className="text-sm text-gray-400 hover:text-white">Documentation</a>
            <a href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy</a>
            <a href="/terms" className="text-sm text-gray-400 hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
} 