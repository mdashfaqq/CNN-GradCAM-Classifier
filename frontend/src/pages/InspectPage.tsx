import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X, AlertCircle, MapPin, Loader2 } from 'lucide-react'
import { analyzeImage } from '@/services/api'
import type { AnalysisResponse, InputSource } from '@/types'

type ViewState = 'camera' | 'preview' | 'analyzing' | 'error'

export default function InspectPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [viewState, setViewState] = useState<ViewState>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState<string>('')

  // Initialize camera
  useEffect(() => {
    if (viewState === 'camera') {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [viewState])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraError(null)
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Camera access was denied or unavailable. You can still upload an image.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setCapturedImage(imageData)
        canvas.toBlob(blob => {
          if (blob) {
            setImageFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
          }
        }, 'image/jpeg')
        stopCamera()
        setViewState('preview')
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/(jpeg|png|webp)/)) {
        setUploadError('Please upload a valid JPG, PNG, or WEBP image.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Image size must be less than 10MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
        setImageFile(file)
        stopCamera()
        setViewState('preview')
        setUploadError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setImageFile(null)
    setViewState('camera')
    startCamera()
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
        })
        setLocationError(null)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationError('Location unavailable. The inspection can continue without GPS information.')
      }
    )
  }

  const analyzeImageHandler = async () => {
    if (!imageFile) return

    setViewState('analyzing')
    setAnalysisProgress('Image received')

    try {
      setAnalysisProgress('Preprocessing')
      await new Promise(resolve => setTimeout(resolve, 500))

      setAnalysisProgress('Running AI model')
      const source: InputSource = 'mobile_camera'
      const timestamp = new Date().toISOString()

      const result: AnalysisResponse = await analyzeImage(imageFile, {
        source,
        latitude: location?.lat,
        longitude: location?.lng,
        timestamp,
      })

      setAnalysisProgress('Generating explanation')
      await new Promise(resolve => setTimeout(resolve, 300))

      setAnalysisProgress('Calculating severity')
      await new Promise(resolve => setTimeout(resolve, 200))

      // Navigate to result page
      navigate(`/inspection/${result.inspection_id}`)
    } catch (error) {
      console.error('Analysis error:', error)
      setViewState('error')
    }
  }

  if (viewState === 'analyzing') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center">
          <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Analyzing Road Image
          </h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="text-green-500 mr-2">✓</span>
              <span>Image received</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="text-green-500 mr-2">✓</span>
              <span>Preprocessing</span>
            </div>
            <div className="flex items-center text-primary-600 dark:text-primary-400">
              <span className="mr-2">●</span>
              <span>{analysisProgress}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <span className="mr-2">○</span>
              <span>Generating explanation</span>
            </div>
            <div className="flex items-center text-gray-400">
              <span className="mr-2">○</span>
              <span>Calculating severity</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Analysis Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your image was not lost. Please try again.
          </p>
          <button
            onClick={retakePhoto}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (viewState === 'preview' && capturedImage) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Captured Image
          </h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full rounded-lg mb-6"
          />

          {/* Location Section */}
          <div className="mb-6">
            <button
              onClick={requestLocation}
              className="w-full flex items-center justify-center space-x-2 btn-secondary mb-3"
            >
              <MapPin className="h-5 w-5" />
              <span>{location ? 'Update Location' : 'Capture GPS Location'}</span>
            </button>
            {location && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Accuracy:</span> ±{location.accuracy.toFixed(0)} m
                </p>
              </div>
            )}
            {locationError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                {locationError}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={retakePhoto}
              className="flex-1 btn-secondary"
            >
              Retake
            </button>
            <button
              onClick={analyzeImageHandler}
              className="flex-1 btn-primary"
            >
              Analyze Image
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card overflow-hidden">
        {/* Camera Header */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-gray-300"
          >
            ←
          </button>
          <h2 className="text-white font-semibold">Road Inspection</h2>
          <div className="w-6" />
        </div>

        {/* Camera View */}
        <div className="relative aspect-[3/4] bg-black">
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">{cameraError}</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Camera Controls */}
        <div className="bg-gray-900 px-4 py-6">
          <div className="flex items-center justify-between">
            <label className="flex-1 flex items-center justify-center space-x-2 text-white hover:text-gray-300 cursor-pointer">
              <Upload className="h-6 w-6" />
              <span>Gallery</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={captureImage}
              disabled={!!cameraError}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-900 mx-auto mt-2" />
            </button>

            <div className="flex-1" />
          </div>

          {uploadError && (
            <p className="text-red-400 text-sm text-center mt-4">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
