import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, FileText, AlertTriangle, MapPin, Info } from 'lucide-react'
import { getInspection, getImageUrl, getOutputUrl } from '@/services/api'
import type { Inspection } from '@/types'

type ViewMode = 'original' | 'heatmap' | 'overlay'

export default function InspectionResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('overlay')
  const [opacity, setOpacity] = useState(0.5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInspection()
  }, [id])

  const loadInspection = async () => {
    if (!id) return

    try {
      const data = await getInspection(id)
      setInspection(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load inspection:', err)
      setError('Failed to load inspection data')
      setLoading(false)
    }
  }

  const saveInspection = () => {
    // In a real app, this would save to local storage or trigger a download
    alert('Inspection saved!')
  }

  const generateReport = () => {
    // In a real app, this would generate a PDF report
    alert('Report generation coming soon!')
  }

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
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'Inspection not found'}</p>
          <button
            onClick={() => navigate('/inspections')}
            className="btn-primary"
          >
            View All Inspections
          </button>
        </div>
      </div>
    )
  }

  const currentImageUrl = viewMode === 'original'
    ? getImageUrl(inspection.image_path)
    : viewMode === 'heatmap'
    ? getOutputUrl(inspection.heatmap_path || '')
    : getOutputUrl(inspection.overlay_path || '')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/inspections')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to History</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={saveInspection}
            className="flex items-center space-x-2 btn-secondary"
          >
            <Save className="h-5 w-5" />
            <span>Save</span>
          </button>
          <button
            onClick={generateReport}
            className="flex items-center space-x-2 btn-primary"
          >
            <FileText className="h-5 w-5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        ROAD DAMAGE ANALYSIS
      </h1>

      {/* Image Comparison */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Image */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Original Image
            </h3>
            <img
              src={getImageUrl(inspection.image_path)}
              alt="Original"
              className="w-full rounded-lg"
            />
          </div>

          {/* Explanation View */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {viewMode === 'original' ? 'Original' : viewMode === 'heatmap' ? 'Heatmap' : 'Grad-CAM Overlay'}
            </h3>
            <div className="relative">
              <img
                src={currentImageUrl}
                alt="Explanation"
                className="w-full rounded-lg"
                style={{ opacity: viewMode === 'overlay' ? opacity : 1 }}
              />
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'original'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overlay'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Overlay
          </button>

          {viewMode === 'overlay' && (
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">Opacity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{Math.round(opacity * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Result */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detected Damage
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {inspection.prediction_class.replace(/_/g, ' ')}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Confidence: {(inspection.confidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* Severity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Severity
          </h3>
          <span className={`inline-block px-4 py-2 rounded-full font-semibold text-lg ${getSeverityColor(inspection.severity)}`}>
            {inspection.severity.toUpperCase()}
          </span>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Score: {(inspection.severity_score * 100).toFixed(0)}%
          </p>
        </div>

        {/* Location */}
        {(inspection.latitude && inspection.longitude) && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Lat:</span> {inspection.latitude.toFixed(6)}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Lng:</span> {inspection.longitude.toFixed(6)}
            </p>
            {inspection.gps_accuracy && (
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Accuracy:</span> ±{inspection.gps_accuracy.toFixed(0)} m
              </p>
            )}
          </div>
        )}

        {/* Model Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Model Information
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Version:</span> {inspection.model_version}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Source:</span> {inspection.source.replace(/_/g, ' ')}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Date:</span> {new Date(inspection.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Explanation Panel */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          WHY DID THE MODEL MAKE THIS PREDICTION?
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            The highlighted regions represent areas that contributed strongly to the model's selected prediction.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Predicted Class:</span> {inspection.prediction_class.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Confidence:</span> {(inspection.confidence * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Explanation Method:</span> Grad-CAM
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: Grad-CAM highlights regions that contributed to the prediction, but does not prove causality.
            The model may focus on relevant features or background artifacts.
          </p>
        </div>
      </div>
    </div>
  )
}
