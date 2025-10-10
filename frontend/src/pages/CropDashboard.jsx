import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Camera, Cloud, FileText, TrendingUp, Plus, ChevronDown, Sprout, ArrowRight, Zap, X } from 'lucide-react'
import { motion } from 'framer-motion'
import CropMainPanelSimple from '../components/dashboard/CropMainPanelSimple'
import AddCropModal from '../components/modals/AddCropModal'
import { api } from '../utils/api'

const CropDashboard = () => {
  const { user } = useAuth()
  const [crops, setCrops] = useState([])
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [showFeaturePanel, setShowFeaturePanel] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const features = [
    { 
      id: 'chatbot', 
      name: 'AI Chat Assistant', 
      icon: MessageSquare, 
      color: 'bg-accent-meadow', 
      description: 'Get intelligent farming advice powered by AI',
      details: 'Ask questions about crop care, pest management, and farming best practices',
      badge: 'AI Powered'
    },
    { 
      id: 'disease', 
      name: 'Disease Detection', 
      icon: Camera, 
      color: 'bg-red-500', 
      description: 'Analyze crop diseases with computer vision',
      details: 'Upload photos to identify diseases and get treatment recommendations',
      badge: 'Smart Analysis'
    },
    { 
      id: 'weather', 
      name: 'Weather Forecast', 
      icon: Cloud, 
      color: 'bg-blue-500', 
      description: 'Monitor weather conditions and forecasts',
      details: 'Get 7-day weather forecasts and farming-specific alerts',
      badge: 'Real-time'
    },
    { 
      id: 'activity', 
      name: 'Activity Log', 
      icon: FileText, 
      color: 'bg-purple-500', 
      description: 'Track and manage farming activities',
      details: 'Record planting, harvesting, and maintenance activities',
      badge: 'Organization'
    },
    { 
      id: 'costs', 
      name: 'Cost Tracking', 
      icon: TrendingUp, 
      color: 'bg-accent-sage', 
      description: 'Monitor and analyze farm expenses',
      details: 'Track seeds, fertilizers, labor costs and generate reports',
      badge: 'Analytics'
    }
  ]

  useEffect(() => {
    if (user) {
      fetchCrops()
    }
  }, [user])

  const fetchCrops = async () => {
    try {
      setLoading(true)
      const response = await api.getCrops()
      if (response.ok) {
        const cropsData = await response.json()
        setCrops(cropsData || [])
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCrop = async (newCrop) => {
    try {
      const response = await api.createCrop(newCrop)
      if (response.ok) {
        const savedCrop = await response.json()
        setCrops([...crops, savedCrop])
        setSelectedCrop(savedCrop)
        setShowAddModal(false)
        fetchCrops()
      }
    } catch (error) {
      console.error('Error adding crop:', error)
    }
  }

  const handleFeatureSelect = (feature) => {
    if (!selectedCrop) {
      alert('Please select a crop first')
      return
    }
    setSelectedCrop({...selectedCrop, feature: feature.id})
    setShowFeaturePanel(true)
  }

  const handleBackToFeatures = () => {
    setShowFeaturePanel(false)
  }

  if (showFeaturePanel) {
    return (
      <CropMainPanelSimple 
        selectedCrop={selectedCrop} 
        onBackToSidebar={handleBackToFeatures}
        showBackButton={true}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">FARM MANAGEMENT</h1>
          <p className="text-text-secondary text-lg">Manage your crops with AI-powered tools</p>
        </motion.div>

        {/* Crop Selection Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-xl p-6 mb-8 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl overflow-visible"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                  <Sprout className="h-6 w-6 text-accent-meadow" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Active Crop</h3>
                  <p className="text-text-secondary">{selectedCrop ? selectedCrop.name : 'No crop selected'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 overflow-visible">
                {/* Crop Selector */}
                <button
                  onClick={() => setShowCropModal(true)}
                  className="glass-card border border-white/20 rounded-lg px-4 py-3 flex items-center space-x-3 min-w-48 hover:bg-white/10 transition-all"
                >
                  <Sprout className="h-5 w-5 text-accent-meadow" />
                  <span className="text-text-primary">
                    {selectedCrop ? selectedCrop.name : 'Select Crop'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </button>
                
                {/* Add Crop Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-4 py-3 rounded-lg flex items-center space-x-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Crop</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleFeatureSelect(feature)}
                className="glass-card border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all text-left group hover:scale-105 duration-200 shadow-lg hover:shadow-xl"
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${feature.color}/20 ${feature.color.replace('bg-', 'text-')} border ${feature.color.replace('bg-', 'border-')}/30`}>
                    {feature.badge}
                  </span>
                  <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-accent-meadow transition-colors" />
                </div>
                
                {/* Icon and Title */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-14 h-14 ${feature.color}/20 rounded-xl flex items-center justify-center group-hover:${feature.color}/30 transition-colors`}>
                    <Icon className={`h-7 w-7 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-meadow transition-colors">{feature.name}</h3>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-text-secondary text-sm mb-3 leading-relaxed">{feature.description}</p>
                
                {/* Details */}
                <p className="text-text-secondary text-xs opacity-75">{feature.details}</p>
                
                {/* Action Indicator */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-text-secondary">Click to access</span>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-accent-meadow" />
                    <span className="text-xs text-accent-meadow font-medium">Ready</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* No Crop Selected State */}
        {!selectedCrop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card border border-white/20 rounded-xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-accent-meadow/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sprout className="h-10 w-10 text-accent-meadow" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Select a Crop to Get Started</h3>
            <p className="text-text-secondary text-lg mb-6">Choose a crop from the dropdown above to access all farming tools and features</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Add Your First Crop
            </button>
          </motion.div>
        )}
      </div>

      {/* Crop Selection Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card border border-white/20 rounded-xl p-6 w-full max-w-md max-h-[70vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-meadow/20 rounded-lg flex items-center justify-center">
                  <Sprout className="h-5 w-5 text-accent-meadow" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Select Crop</h3>
              </div>
              <button
                onClick={() => setShowCropModal(false)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="p-8 text-center text-text-secondary">
                  <div className="animate-spin w-6 h-6 border-2 border-accent-meadow border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading crops...
                </div>
              ) : crops.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Sprout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No crops found</p>
                  <button
                    onClick={() => {
                      setShowCropModal(false)
                      setShowAddModal(true)
                    }}
                    className="bg-accent-meadow text-white px-4 py-2 rounded-lg hover:bg-accent-meadow/80 transition-colors"
                  >
                    Add Your First Crop
                  </button>
                </div>
              ) : (
                crops.map(crop => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCrop(crop)
                      setShowCropModal(false)
                    }}
                    className="w-full p-4 glass-card border border-accent-meadow/20 rounded-lg hover:bg-accent-meadow/10 hover:border-accent-meadow/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-meadow/30 to-accent-sage/30 rounded-lg flex items-center justify-center group-hover:from-accent-meadow/50 group-hover:to-accent-sage/50 transition-all">
                          <Sprout className="h-4 w-4 text-accent-meadow group-hover:text-accent-meadow transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary group-hover:text-accent-meadow transition-colors">{crop.name}</h4>
                          {crop.variety && (
                            <p className="text-sm text-text-secondary">{crop.variety}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-accent-sage group-hover:text-accent-meadow transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Crop Modal */}
      <AddCropModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCrop}
      />
    </div>
  )
}

export default CropDashboard