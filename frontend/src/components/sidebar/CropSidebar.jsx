import { useState, useEffect } from 'react'
import { Plus, Wheat, Trash2, MessageSquare, Camera, Cloud, TrendingUp, FileText } from 'lucide-react'
import AddCropModal from '../modals/AddCropModal'
import { api } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const CropSidebar = ({ onCropSelect, selectedCrop }) => {
  const { user } = useAuth()
  const [crops, setCrops] = useState([])
  const [selectedCropId, setSelectedCropId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCrops = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping crop fetch')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      console.log('Fetching crops for user:', user.id)
      const response = await api.getCrops()
      
      if (response.ok) {
        const crops = await response.json()
        console.log('Fetched crops:', crops)
        setCrops(crops || [])
      } else {
        console.error('Failed to fetch crops:', response.status)
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired')
        }
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCrops()
    }
  }, [user])

  const handleAddCrop = async (newCrop) => {
    try {
      console.log('Creating crop:', newCrop)
      console.log('User:', user)
      
      const response = await api.createCrop(newCrop)
      console.log('Create crop response status:', response.status)
      
      if (response.ok) {
        const savedCrop = await response.json()
        console.log('Saved crop:', savedCrop)
        setCrops([...crops, savedCrop])
        setSelectedCropId(savedCrop.id)
        onCropSelect(savedCrop)
        setShowAddModal(false)
        // Refresh crops list to make sure
        fetchCrops()
      } else {
        const errorText = await response.text()
        console.error('Failed to create crop:', response.status, errorText)
        alert(`Failed to create crop: ${errorText}`)
      }
    } catch (error) {
      console.error('Error adding crop:', error)
      alert(`Error adding crop: ${error.message}`)
    }
  }

  const handleCropClick = (crop) => {
    setSelectedCropId(crop.id)
    // Just show feature options, don't auto-navigate
  }

  const handleDeleteCrop = async (cropId, cropName) => {
    if (!confirm(`Are you sure you want to delete ${cropName}?`)) {
      return
    }
    
    try {
      const response = await api.deleteCrop(cropId)
      if (response.ok) {
        setCrops(crops.filter(crop => crop.id !== cropId))
        if (selectedCropId === cropId) {
          setSelectedCropId(null)
          onCropSelect(null)
        }
      } else {
        alert('Failed to delete crop')
      }
    } catch (error) {
      console.error('Error deleting crop:', error)
      alert('Error deleting crop')
    }
  }

  return (
    <>
      <div className="w-full glass-card border-white/10 h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary uppercase tracking-wider">MY CROPS</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 bg-accent-green hover:bg-accent-green/80 rounded-full flex items-center justify-center transition-all"
            title="Add Crop"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Crops List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto"></div>
              <p className="text-text-secondary text-sm mt-2">Loading crops...</p>
            </div>
          ) : crops.length === 0 ? (
            // Empty state
            <div className="p-6 text-center">
              <Wheat className="h-16 w-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary mb-6">No crops added yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="accent-button w-full flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Crop</span>
              </button>
            </div>
          ) : (
            // Crops list
            <div className="p-3 sm:p-4 max-w-2xl mx-auto">
              {crops.map((crop) => (
                <div
                  key={crop.id}
                  className={`p-4 rounded-xl transition-all mb-3 ${
                    selectedCropId === crop.id
                      ? 'bg-accent-green/20 border border-accent-green/30'
                      : 'glass-card hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      onClick={() => handleCropClick(crop)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedCropId === crop.id ? 'bg-accent-green/30' : 'bg-white/10'
                      }`}>
                        <Wheat className={`h-6 w-6 ${
                          selectedCropId === crop.id ? 'text-accent-green' : 'text-text-secondary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary truncate">{crop.name}</p>
                        <p className="text-sm text-text-secondary truncate">
                          {crop.variety || 'No variety'} • {crop.area || 'No area'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCrop(crop.id, crop.name)
                      }}
                      className="p-2 text-text-secondary hover:text-accent-orange transition-colors"
                      title="Delete crop"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {selectedCropId === crop.id && (
                    <div className="space-y-2">
                      <button
                        onClick={() => onCropSelect({...crop, feature: 'chatbot'})}
                        className="w-full p-3 glass-card hover:bg-accent-orange/20 transition-all flex items-center space-x-3"
                      >
                        <MessageSquare className="h-5 w-5 text-accent-orange" />
                        <span className="text-sm text-text-primary">AI Chat Assistant</span>
                      </button>
                      <button
                        onClick={() => onCropSelect({...crop, feature: 'disease'})}
                        className="w-full p-3 glass-card hover:bg-red-500/20 transition-all flex items-center space-x-3"
                      >
                        <Camera className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-text-primary">Disease Detection</span>
                      </button>
                      <button
                        onClick={() => onCropSelect({...crop, feature: 'weather'})}
                        className="w-full p-3 glass-card hover:bg-accent-teal/20 transition-all flex items-center space-x-3"
                      >
                        <Cloud className="h-5 w-5 text-accent-teal" />
                        <span className="text-sm text-text-primary">Weather Forecast</span>
                      </button>
                      <button
                        onClick={() => onCropSelect({...crop, feature: 'activity'})}
                        className="w-full p-3 glass-card hover:bg-purple-500/20 transition-all flex items-center space-x-3"
                      >
                        <FileText className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-text-primary">Activity Log</span>
                      </button>
                      <button
                        onClick={() => onCropSelect({...crop, feature: 'costs'})}
                        className="w-full p-3 glass-card hover:bg-accent-green/20 transition-all flex items-center space-x-3"
                      >
                        <TrendingUp className="h-5 w-5 text-accent-green" />
                        <span className="text-sm text-text-primary">Cost Tracking</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


      </div>

      {/* Add Crop Modal */}
      <AddCropModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCrop}
      />
    </>
  )
}

export default CropSidebar