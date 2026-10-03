import { Link } from 'react-router-dom'
import { Camera, Brain, AlertTriangle, MapPin, Clock, Flame } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const features = [
    {
      icon: Camera,
      title: 'Mobile Camera',
      description: 'Capture road images directly from your smartphone camera',
    },
    {
      icon: Brain,
      title: 'AI Damage Detection',
      description: 'Advanced neural network detects and classifies road damage',
    },
    {
      icon: AlertTriangle,
      title: 'Severity Assessment',
      description: 'Automatic estimation of damage severity levels',
    },
    {
      icon: Flame,
      title: 'Explainable AI',
      description: 'Grad-CAM heatmaps show what the model focused on',
    },
    {
      icon: MapPin,
      title: 'GPS Inspection Mapping',
      description: 'Optional GPS tracking for precise location data',
    },
    {
      icon: Clock,
      title: 'Inspection History',
      description: 'Track and review all your past inspections',
    },
  ]

  const steps = [
    { label: 'CAPTURE', icon: Camera },
    { label: 'ANALYZE', icon: Brain },
    { label: 'DETECT', icon: AlertTriangle },
    { label: 'EXPLAIN', icon: Flame },
    { label: 'REPORT', icon: MapPin },
  ]

  const technologies = [
    'PyTorch',
    'FastAPI',
    'React',
    'Grad-CAM',
    'PostgreSQL',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              AI VISUAL INSPECTION
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
              Turn road images into actionable insights.
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Capture a road image with your phone and let AI detect, analyze and explain road damage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/inspect"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Inspection
              </Link>
              <Link
                to="/dashboard"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                  <step.icon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{step.label}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute mt-10 text-primary-400">
                    ↓
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Technology
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white font-medium"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Inspecting?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Capture your first road image and see AI in action.
          </p>
          <Link
            to="/inspect"
            className="inline-block bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start Inspection
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center">
        <p>&copy; 2024 AI Visual Inspection Framework. All rights reserved.</p>
      </footer>
    </div>
  )
}

import LayoutDashboard from 'lucide-react'
