import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, MessageSquare, Camera, Cloud, TrendingUp, FileText, Sprout } from 'lucide-react'
import ChatbotFeature from '../features/ChatbotFeature'
import DiseaseDetection from '../features/DiseaseDetection'
import WeatherFeature from '../features/WeatherFeature'
import MarketPrice from '../features/MarketPrice'
import ActivityLog from '../features/ActivityLog'

const CropMainPanel = ({ selectedCrop }) => {
  const [activeFeature, setActiveFeature] = useState('overview')
  const scrollRef = useRef(null)

  const features = [
    { id: 'chatbot', name: 'AI Chatbot', icon: MessageSquare, color: 'bg-blue-500' },
    { id: 'disease', name: 'Disease Detection', icon: Camera, color: 'bg-red-500' },
    { id: 'weather', name: 'Weather', icon: Cloud, color: 'bg-sky-500' },
    { id: 'market', name: 'Market Price', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'activity', name: 'Activity Log', icon: FileText, color: 'bg-purple-500' }
  ]

  const scroll = (direction) => {
    const container = scrollRef.current
    const scrollAmount = 200
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const renderFeatureContent = () => {
    if (!selectedCrop) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sprout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a crop to get started
            </h3>
            <p className="text-gray-500">
              Choose a crop from the sidebar to access AI-powered farming tools
            </p>
          </div>
        </div>
      )
    }

    switch (activeFeature) {
      case 'chatbot':
        return <ChatbotFeature crop={selectedCrop} />
      case 'disease':
        return <DiseaseDetection crop={selectedCrop} />
      case 'weather':
        return <WeatherFeature crop={selectedCrop} />
      case 'market':
        return <MarketPrice crop={selectedCrop} />
      case 'activity':
        return <ActivityLog crop={selectedCrop} />
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedCrop.name} Dashboard
              </h3>
              <p className="text-gray-500 mb-6">
                Select a feature above to manage your {selectedCrop.name} crop
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Variety</p>
                  <p className="font-semibold">{selectedCrop.variety}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">{selectedCrop.location}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Planted</p>
                  <p className="font-semibold">{new Date(selectedCrop.plantingDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Harvest</p>
                  <p className="font-semibold">{new Date(selectedCrop.harvestDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Bar */}
      <div className="border-b border-gray-200 p-6">
        {/* Crop Name */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCrop ? selectedCrop.name : 'My Crops'}
          </h1>
          {selectedCrop && (
            <p className="text-gray-600">
              {selectedCrop.variety} • {selectedCrop.location}
            </p>
          )}
        </div>

        {/* Feature Widgets */}
        {selectedCrop && (
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            {/* Scrollable Features */}
            <div
              ref={scrollRef}
              className="flex space-x-4 overflow-x-auto scrollbar-hide px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className={`flex-shrink-0 flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[120px] ${
                      activeFeature === feature.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${feature.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${
                      activeFeature === feature.id ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {feature.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Feature Content Area */}
      {renderFeatureContent()}
    </div>
  )
}

export default CropMainPanel