import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { getInspections } from '@/services/api'
import type { Inspection } from '@/types'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'high':
      return '#ef4444'
    case 'medium':
      return '#f59e0b'
    case 'low':
      return '#10b981'
    default:
      return '#6b7280'
  }
}

const createCustomIcon = (severity: string) => {
  const color = getSeverityColor(severity)
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function MapView({ inspections }: { inspections: Inspection[] }) {
  const map = useMap()

  useEffect(() => {
    if (inspections.length > 0) {
      const bounds = L.latLngBounds(
        inspections
          .filter(i => i.latitude && i.longitude)
          .map(i => [i.latitude!, i.longitude!])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [inspections, map])

  return null
}

export default function MapPage() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

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

  const inspectionsWithLocation = inspections.filter(
    inspection => inspection.latitude && inspection.longitude
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          INSPECTION MAP
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View inspections with GPS coordinates on the map
        </p>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Severity Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getSeverityColor('high') }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getSeverityColor('medium') }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getSeverityColor('low') }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Low</span>
          </div>
        </div>
      </div>

      {/* Map */}
      {inspectionsWithLocation.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No inspections with GPS coordinates found.
          </p>
          <button
            onClick={() => (window.location.href = '/inspect')}
            className="btn-primary"
          >
            Start Inspection with GPS
          </button>
        </div>
      ) : (
        <div className="card p-2 overflow-hidden">
          <div className="h-[600px] rounded-lg overflow-hidden">
            <MapContainer
              center={[0, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapView inspections={inspectionsWithLocation} />
              {inspectionsWithLocation.map(inspection => (
                <Marker
                  key={inspection.id}
                  position={[inspection.latitude!, inspection.longitude!]}
                  icon={createCustomIcon(inspection.severity)}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">
                        {inspection.prediction_class.replace(/_/g, ' ')}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Severity:</span>{' '}
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(inspection.severity)}`}>
                            {inspection.severity.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Confidence:</span>{' '}
                          {(inspection.confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(inspection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/inspection/${inspection.id}`)}
                        className="mt-3 w-full bg-primary-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        View Inspection
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {inspectionsWithLocation.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Inspections on Map</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {inspectionsWithLocation.filter(i => i.severity === 'high').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">High Severity</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {inspectionsWithLocation.filter(i => i.severity === 'medium').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Medium Severity</p>
        </div>
      </div>
    </div>
  )
}
