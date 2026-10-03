/** API service for communicating with backend */

import axios from 'axios'
import type {
  AnalysisResponse,
  Analytics,
  HealthStatus,
  Inspection,
  InspectionInput,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Health check
export const healthCheck = async (): Promise<HealthStatus> => {
  const response = await api.get<HealthStatus>('/api/health')
  return response.data
}

// Analyze image
export const analyzeImage = async (
  image: File,
  data: InspectionInput
): Promise<AnalysisResponse> => {
  const formData = new FormData()
  formData.append('image', image)
  formData.append('source', data.source)
  if (data.latitude !== undefined) {
    formData.append('latitude', data.latitude.toString())
  }
  if (data.longitude !== undefined) {
    formData.append('longitude', data.longitude.toString())
  }
  if (data.timestamp) {
    formData.append('timestamp', data.timestamp)
  }

  const response = await api.post<AnalysisResponse>('/api/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Get inspections list
export const getInspections = async (skip = 0, limit = 50): Promise<Inspection[]> => {
  const response = await api.get<Inspection[]>('/api/inspections', {
    params: { skip, limit },
  })
  return response.data
}

// Get single inspection
export const getInspection = async (id: string): Promise<Inspection> => {
  const response = await api.get<Inspection>(`/api/inspections/${id}`)
  return response.data
}

// Get analytics
export const getAnalytics = async (): Promise<Analytics> => {
  const response = await api.get<Analytics>('/api/analytics')
  return response.data
}

// Get image URL helper
export const getImageUrl = (path: string): string => {
  return `${API_BASE_URL}/${path}`
}

// Get output URL helper
export const getOutputUrl = (path: string): string => {
  return `${API_BASE_URL}/api/outputs/${path}`
}

export default api
