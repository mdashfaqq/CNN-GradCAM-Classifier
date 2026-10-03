import { useState, useEffect } from 'react'
import { getAnalytics } from '@/services/api'
import type { Analytics } from '@/types'
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899']

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics || analytics.total_inspections === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-12 text-center">
          <LayoutDashboard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No inspection data yet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start your first inspection to see analytics here.
          </p>
          <button
            onClick={() => (window.location.href = '/inspect')}
            className="btn-primary"
          >
            Start Inspection
          </button>
        </div>
      </div>
    )
  }

  const damageTypeData = Object.entries(analytics.damage_type_distribution).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }))

  const severityData = Object.entries(analytics.severity_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const timeSeriesData = analytics.inspections_over_time.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI VISUAL INSPECTION
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Dashboard</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-primary-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.total_inspections}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Inspections</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Damaged</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.damaged_roads}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Roads</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-red-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">High</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.high_severity}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Severity</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(analytics.average_confidence * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Confidence</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Damage Type Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Damage Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={damageTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {damageTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inspections Over Time */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Inspections Over Time (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
