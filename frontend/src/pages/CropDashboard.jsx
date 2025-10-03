import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import CropSidebar from '../components/sidebar/CropSidebar'
import CropMainPanelSimple from '../components/dashboard/CropMainPanelSimple'

const CropDashboard = () => {
  const { user } = useAuth()
  const [selectedCrop, setSelectedCrop] = useState(null)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <CropSidebar onCropSelect={setSelectedCrop} selectedCrop={selectedCrop} />
      
      {/* Main Content Area */}
      <CropMainPanelSimple selectedCrop={selectedCrop} />
    </div>
  )
}

export default CropDashboard