import { Link, useLocation } from 'react-router-dom'
import { Camera, LayoutDashboard, List, Map, Home } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AI Visual Inspection
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/inspect"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/inspect')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Camera className="h-5 w-5" />
                <span>Inspect</span>
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/inspections"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/inspections')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <List className="h-5 w-5" />
                <span>History</span>
              </Link>
              <Link
                to="/map"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/map')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Map className="h-5 w-5" />
                <span>Map</span>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <LayoutDashboard className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/inspect"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 ${
              isActive('/inspect')
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Inspect</span>
          </Link>
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 ${
              isActive('/dashboard')
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link
            to="/inspections"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 ${
              isActive('/inspections')
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <List className="h-6 w-6" />
            <span className="text-xs">History</span>
          </Link>
          <Link
            to="/map"
            className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 ${
              isActive('/map')
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Map className="h-6 w-6" />
            <span className="text-xs">Map</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}
