import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import { MessageSquare, Camera, Cloud, FileText, TrendingUp, Plus, ChevronDown, Sprout, ArrowRight, Zap, X, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import CropMainPanelSimple from '../components/dashboard/CropMainPanelSimple'
import AddCropModal from '../components/modals/AddCropModal'
import { api } from '../utils/api'

const CropDashboard = () => {
  const { user } = useAuth()
  const location = useLocation()
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
      color: 'bg-accent-sage', 
      description: 'Analyze crop diseases with computer vision',
      details: 'Upload photos to identify diseases and get treatment recommendations',
      badge: 'Smart Analysis'
    },
    { 
      id: 'weather', 
      name: 'Weather Forecast', 
      icon: Cloud, 
      color: 'bg-accent-olive', 
      description: 'Monitor weather conditions and forecasts',
      details: 'Get 7-day weather forecasts and farming-specific alerts',
      badge: 'Real-time'
    },
    { 
      id: 'activity', 
      name: 'Activity Log', 
      icon: FileText, 
      color: 'bg-gray-600', 
      description: 'Track and manage farming activities',
      details: 'Record planting, harvesting, and maintenance activities',
      badge: 'Organization'
    },
    { 
      id: 'costs', 
      name: 'Cost Tracking', 
      icon: TrendingUp, 
      color: 'bg-gray-700', 
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

  // Reset feature panel when navigating to /crops
  useEffect(() => {
    setShowFeaturePanel(false)
  }, [location])

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

  const handleDeleteCrop = async (cropId, cropName) => {
    if (!confirm(`Are you sure you want to delete ${cropName}?`)) {
      return
    }
    
    try {
      const response = await api.deleteCrop(cropId)
      if (response.ok) {
        setCrops(crops.filter(crop => crop.id !== cropId))
        if (selectedCrop?.id === cropId) {
          setSelectedCrop(null)
        }
      } else {
        alert('Failed to delete crop')
      }
    } catch (error) {
      console.error('Error deleting crop:', error)
      alert('Error deleting crop')
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
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/5 via-white to-accent-sage/5 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-meadow via-accent-sage to-accent-olive bg-clip-text text-transparent mb-2">FARM MANAGEMENT</h1>
          <p className="text-text-secondary text-lg font-medium">Manage your crops with AI-powered tools like dashboard colors</p>
        </motion.div>

        {/* Crop Selection Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-xl p-6 mb-8 bg-gradient-to-br from-white via-accent-meadow/10 to-accent-sage/10 backdrop-blur-md border border-accent-meadow/20 shadow-xl overflow-visible"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-meadow/5 to-accent-sage/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/15 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent-meadow/20 rounded-lg flex items-center justify-center shadow-lg">
                  <Sprout className="h-6 w-6 text-accent-meadow" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Active Crop</h3>
                  <p className="text-text-secondary font-medium">{selectedCrop ? selectedCrop.name : 'No crop selected'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 overflow-visible">
                {/* Crop Selector */}
                <button
                  onClick={() => setShowCropModal(true)}
                  className="bg-white/80 backdrop-blur-sm border border-accent-meadow/30 rounded-lg px-4 py-3 flex items-center space-x-3 min-w-48 hover:bg-white hover:border-accent-meadow/50 transition-all shadow-md"
                >
                  <Sprout className="h-5 w-5 text-accent-meadow" />
                  <span className="text-text-primary font-medium">
                    {selectedCrop ? selectedCrop.name : 'Select Crop'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </button>
                
                {/* Add Crop Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-accent-meadow hover:bg-accent-meadow/90 text-white px-4 py-3 rounded-lg flex items-center space-x-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
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
                className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 hover:bg-white hover:border-accent-meadow/30 transition-all text-left group hover:scale-105 duration-200 shadow-lg hover:shadow-xl"
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${feature.color}/20 ${feature.color.replace('bg-', 'text-')} border ${feature.color.replace('bg-', 'border-')}/30 shadow-sm`}>
                    {feature.badge}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                
                {/* Icon and Title */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-14 h-14 ${feature.color}/20 rounded-xl flex items-center justify-center group-hover:${feature.color}/30 transition-all shadow-md group-hover:shadow-lg`}>
                    <Icon className={`h-7 w-7 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-meadow transition-colors">{feature.name}</h3>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-text-secondary text-sm mb-3 leading-relaxed font-medium">{feature.description}</p>
                
                {/* Details */}
                <p className="text-gray-500 text-xs opacity-90">{feature.details}</p>
                
                {/* Action Indicator */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
                  <span className="text-xs text-gray-500 font-medium">Click to access</span>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-accent-meadow" />
                    <span className="text-xs text-accent-meadow font-semibold">Ready</span>
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
            className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-12 text-center shadow-lg"
          >
            <div className="w-20 h-20 bg-accent-meadow/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sprout className="h-10 w-10 text-accent-meadow" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Select a Crop to Get Started</h3>
            <p className="text-text-secondary text-lg mb-6 font-medium">Choose a crop from the dropdown above to access all farming tools and features</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent-meadow hover:bg-accent-meadow/90 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
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
            className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl p-6 w-full max-w-md max-h-[70vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-meadow/20 rounded-lg flex items-center justify-center shadow-md">
                  <Sprout className="h-5 w-5 text-accent-meadow" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Select Crop</h3>
              </div>
              <button
                onClick={() => setShowCropModal(false)}
                className="p-2 text-gray-500 hover:text-text-primary hover:bg-gray-100/50 rounded-lg transition-colors"
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
                    className="bg-accent-meadow text-white px-4 py-2 rounded-lg hover:bg-accent-meadow/90 transition-all shadow-md"
                  >
                    Add Your First Crop
                  </button>
                </div>
              ) : (
                crops.map(crop => (
                  <div
                    key={crop.id}
                    className="w-full p-4 bg-white/80 backdrop-blur-sm border border-accent-meadow/20 rounded-lg hover:bg-accent-meadow/5 hover:border-accent-meadow/40 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCrop(crop)
                          setShowCropModal(false)
                        }}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <div className="w-8 h-8 bg-accent-meadow/20 rounded-lg flex items-center justify-center group-hover:bg-accent-meadow/30 transition-all shadow-sm">
                          <Sprout className="h-4 w-4 text-accent-meadow transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary group-hover:text-accent-meadow transition-colors">{crop.name}</h4>
                          {crop.variety && (
                            <p className="text-sm text-text-secondary font-medium">{crop.variety}</p>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCrop(crop.id, crop.name)
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete crop"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-accent-meadow transition-colors" />
                      </div>
                    </div>
                  </div>
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