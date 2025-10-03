import { useState, useEffect } from 'react'
import { Plus, Wheat, Trash2 } from 'lucide-react'
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
    onCropSelect(crop)
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
      <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Crops</h2>
        </div>

        {/* Crops List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Loading crops...</p>
            </div>
          ) : crops.length === 0 ? (
            // Empty state
            <div className="p-4 text-center">
              <Wheat className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No crops added yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Crop</span>
              </button>
            </div>
          ) : (
            // Crops list
            <div className="p-2">
              {crops.map((crop) => (
                <div
                  key={crop.id}
                  className={`p-3 rounded-lg transition-colors mb-2 ${
                    selectedCropId === crop.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      onClick={() => handleCropClick(crop)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedCropId === crop.id ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Wheat className={`h-5 w-5 ${
                          selectedCropId === crop.id ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{crop.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {crop.variety || 'No variety'} • {crop.area || 'No area specified'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCrop(crop.id, crop.name)
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete crop"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Crop Button (when crops exist) */}
        {crops.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Crop</span>
            </button>
          </div>
        )}
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