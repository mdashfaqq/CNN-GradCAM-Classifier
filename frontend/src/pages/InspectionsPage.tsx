import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowUpDown, MapPin, AlertTriangle, Clock } from 'lucide-react'
import { getInspections, getImageUrl } from '@/services/api'
import type { Inspection, DamageClass, SeverityLevel } from '@/types'

type SortField = 'created_at' | 'confidence' | 'severity_score'
type SortOrder = 'asc' | 'desc'

export default function InspectionsPage() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDamage, setFilterDamage] = useState<DamageClass | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    loadInspections()
  }, [])

  const loadInspections = async () => {
    try {
      const data = await getInspections()
      setInspections(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load inspections:', error)
      setLoading(false)
    }
  }

  const filteredInspections = inspections
    .filter(inspection => {
      const matchesSearch =
        inspection.prediction_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.source.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDamage = filterDamage === 'all' || inspection.prediction_class === filterDamage
      const matchesSeverity = filterSeverity === 'all' || inspection.severity === filterSeverity
      return matchesSearch && matchesDamage && matchesSeverity
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'confidence') {
        comparison = a.confidence - b.confidence
      } else if (sortField === 'severity_score') {
        comparison = a.severity_score - b.severity_score
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading inspections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Inspection History
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage all your road damage inspections
        </p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Damage Type Filter */}
          <select
            value={filterDamage}
            onChange={(e) => setFilterDamage(e.target.value as DamageClass | 'all')}
            className="input-field"
          >
            <option value="all">All Damage Types</option>
            <option value="pothole">Pothole</option>
            <option value="longitudinal_crack">Longitudinal Crack</option>
            <option value="transverse_crack">Transverse Crack</option>
            <option value="alligator_crack">Alligator Crack</option>
            <option value="surface_damage">Surface Damage</option>
            <option value="no_damage">No Damage</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'all')}
            className="input-field"
          >
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortField(field as SortField)
              setSortOrder(order as SortOrder)
            }}
            className="input-field"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="confidence-desc">Highest Confidence</option>
            <option value="confidence-asc">Lowest Confidence</option>
            <option value="severity_score-desc">Highest Severity</option>
            <option value="severity_score-asc">Lowest Severity</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-gray-600 dark:text-gray-300">
        Showing {filteredInspections.length} of {inspections.length} inspections
      </p>

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No inspections found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Try adjusting your filters or start a new inspection.
          </p>
          <button
            onClick={() => (window.location.href = '/inspect')}
            className="btn-primary"
          >
            Start Inspection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspections.map(inspection => (
            <div
              key={inspection.id}
              onClick={() => navigate(`/inspection/${inspection.id}`)}
              className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                <img
                  src={getImageUrl(inspection.image_path)}
                  alt={inspection.prediction_class}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {inspection.prediction_class.replace(/_/g, ' ')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(inspection.severity)}`}>
                    {inspection.severity}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    <span>Confidence: {(inspection.confidence * 100).toFixed(1)}%</span>
                  </div>

                  {(inspection.latitude && inspection.longitude) && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {inspection.latitude.toFixed(4)}, {inspection.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{new Date(inspection.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import Activity from 'lucide-react'
