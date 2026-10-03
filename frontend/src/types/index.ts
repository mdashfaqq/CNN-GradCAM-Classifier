/** TypeScript type definitions for AI Visual Inspection Framework */

export type DamageClass =
  | 'pothole'
  | 'longitudinal_crack'
  | 'transverse_crack'
  | 'alligator_crack'
  | 'surface_damage'
  | 'no_damage'

export type SeverityLevel = 'low' | 'medium' | 'high'
export type InputSource = 'mobile_camera' | 'upload' | 'drone' | 'video'

export interface Prediction {
  class: DamageClass
  confidence: number
  probabilities: Record<DamageClass, number>
}

export interface Severity {
  label: SeverityLevel
  score: number
}

export interface Explanation {
  method: string
  heatmap_url: string
  overlay_url: string
}

export interface Location {
  latitude?: number
  longitude?: number
  accuracy?: number
  timestamp?: string
}

export interface AnalysisResponse {
  inspection_id: string
  prediction: Prediction
  severity: Severity
  explanation: Explanation
  location: Location
  model_version: string
  demo_mode: boolean
}

export interface Inspection {
  id: string
  created_at: string
  source: InputSource
  image_path: string
  heatmap_path?: string
  overlay_path?: string
  prediction_class: DamageClass
  confidence: number
  severity: SeverityLevel
  severity_score: number
  latitude?: number
  longitude?: number
  gps_accuracy?: number
  model_version: string
  input_timestamp?: string
}

export interface Analytics {
  total_inspections: number
  damaged_roads: number
  high_severity: number
  average_confidence: number
  damage_type_distribution: Record<string, number>
  severity_distribution: Record<string, number>
  inspections_over_time: Array<{ date: string; count: number }>
}

export interface HealthStatus {
  status: string
  model_loaded: boolean
  demo_mode: boolean
  database_connected: boolean
}

export interface InspectionInput {
  source: InputSource
  latitude?: number
  longitude?: number
  timestamp?: string
}
