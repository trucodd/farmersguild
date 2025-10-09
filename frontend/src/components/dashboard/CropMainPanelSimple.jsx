import { useState, useRef, useEffect } from 'react'
import { Sprout, ChevronLeft, ChevronRight, MessageSquare, Camera, Cloud, TrendingUp, FileText, Send, Bot, User } from 'lucide-react'
import DiseaseDetectionFeature from './DiseaseDetectionFeature'
import WeatherFeature from './WeatherFeature'
import ActivityLogFeature from './ActivityLogFeature'
import CostTracker from '../costs/CostTracker'
import { api } from '../../utils/api'

const CropMainPanelSimple = ({ selectedCrop }) => {
  const [activeFeature, setActiveFeature] = useState('overview')
  const scrollRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Disease Detection State
  const [diseaseHistory, setDiseaseHistory] = useState([])
  const [currentPrediction, setCurrentPrediction] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPrecautions, setShowPrecautions] = useState(false)
  const [showTreatment, setShowTreatment] = useState(false)
  const [diseaseView, setDiseaseView] = useState('history') // 'history', 'upload', 'result'
  
  // Load crop-specific data when crop changes
  useEffect(() => {
    if (selectedCrop) {
      loadCropData(selectedCrop.id)
    } else {
      clearAllData()
    }
  }, [selectedCrop])

  const loadCropData = async (cropId) => {
    try {
      // Clear existing data first
      setMessages([])
      setDiseaseHistory([])
      
      // Load chat history
      const chatResponse = await api.getCropChatHistory(cropId)
      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        const chatMessages = []
        chatData.chat_history.forEach(conv => {
          chatMessages.push({ id: `user-${conv.id}`, type: 'user', content: conv.message, timestamp: new Date(conv.created_at) })
          chatMessages.push({ id: `bot-${conv.id}`, type: 'bot', content: conv.response, timestamp: new Date(conv.created_at) })
        })
        setMessages(chatMessages)
      }

      // Load disease history
      const diseaseResponse = await api.getDiseaseHistory(cropId)
      if (diseaseResponse.ok) {
        const diseaseData = await diseaseResponse.json()
        const formattedHistory = diseaseData.detections.map(detection => ({
          id: detection.id,
          detection_id: detection.id,
          disease: detection.disease_name,
          confidence: detection.confidence,
          severity: detection.severity,
          timestamp: new Date(detection.detected_at),
          cause: 'detected via AI analysis',
          precautions: ['Monitor plant health', 'Maintain proper care'],
          treatment: ['Consult expert', 'Apply recommended treatment']
        }))
        setDiseaseHistory(formattedHistory)
      }
    } catch (error) {
      console.error('Error loading crop data:', error)
    }
  }

  const clearAllData = () => {
    setMessages([])
    setDiseaseHistory([])
    setCurrentPrediction(null)
    setDiseaseView('history')
    setShowPrecautions(false)
    setShowTreatment(false)
  }

  // Initialize chat when chatbot is selected
  const initializeChat = () => {
    if (messages.length === 0 && selectedCrop) {
      setMessages([{
        id: 1,
        type: 'bot',
        content: `Hello! I'm your AI farming assistant. I'm here to help with your ${selectedCrop.name} crop. What would you like to know?`,
        timestamp: new Date()
      }])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      console.log('Sending message to crop AI:', { cropId: selectedCrop.id, message: currentMessage })
      const response = await api.chatWithCrop(selectedCrop.id, currentMessage)
      console.log('AI API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('AI response data:', data)
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botResponse])
      } else {
        console.error('AI API error:', response.status, await response.text())
        const errorResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting. Please check your connection and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  // Disease Detection Functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setIsAnalyzing(true)
        setDiseaseView('result')
        
        // Simulate AI analysis
        setTimeout(async () => {
          const prediction = {
            id: Date.now(),
            image: e.target.result,
            disease: 'Powdery Mildew',
            cause: 'high humidity and poor ventilation',
            confidence: 87,
            timestamp: new Date(),
            precautions: [
              'Improve air circulation around plants',
              'Avoid overhead watering',
              'Remove affected leaves immediately',
              'Maintain proper plant spacing'
            ],
            treatment: [
              'Apply neem oil spray every 7 days',
              'Use baking soda solution (1 tsp per liter)',
              'Apply copper-based fungicide',
              'Increase sunlight exposure'
            ]
          }
          setCurrentPrediction(prediction)
          // Reload disease history from backend
          await loadCropData(selectedCrop.id)
          setIsAnalyzing(false)
        }, 3000)
      }
      reader.readAsDataURL(file)
    }
  }

  const selectPrediction = (prediction) => {
    setCurrentPrediction(prediction)
    setDiseaseView('result')
    setShowPrecautions(false)
    setShowTreatment(false)
  }

  const features = [
    { id: 'chatbot', name: 'AI Chatbot', icon: MessageSquare, color: 'bg-blue-500' },
    { id: 'disease', name: 'Disease Detection', icon: Camera, color: 'bg-red-500' },
    { id: 'weather', name: 'Weather', icon: Cloud, color: 'bg-sky-500' },
    { id: 'activity', name: 'Activity Log', icon: FileText, color: 'bg-purple-500' },
    { id: 'costs', name: 'Cost Tracking', icon: TrendingUp, color: 'bg-green-500' }
  ]

  const scroll = (direction) => {
    const container = scrollRef.current
    const scrollAmount = 200
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
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
              {selectedCrop.variety || 'No variety'} • {selectedCrop.area || 'No area specified'}
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

      {/* Content Area */}
      <div className={`flex-1 ${activeFeature === 'chatbot' || activeFeature === 'disease' || activeFeature === 'weather' || activeFeature === 'activity' ? 'flex flex-col' : 'flex items-center justify-center'}`}>
        {selectedCrop ? (
          <div className="text-center">
            {activeFeature === 'overview' ? (
              <>
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
                    <p className="font-semibold">{selectedCrop.variety || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-semibold">{selectedCrop.area || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Planted</p>
                    <p className="font-semibold">{selectedCrop.planting_date ? new Date(selectedCrop.planting_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Harvest</p>
                    <p className="font-semibold">{selectedCrop.harvest_date ? new Date(selectedCrop.harvest_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
              </>
            ) : activeFeature === 'chatbot' ? (
              <div className="w-full h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-green-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Crop Assistant</h3>
                      <p className="text-sm text-gray-600">Specialized for {selectedCrop.name} farming</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && initializeChat()}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm text-gray-600">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Ask about your ${selectedCrop.name}...`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : activeFeature === 'disease' ? (
              <DiseaseDetectionFeature 
                selectedCrop={selectedCrop} 
                diseaseHistory={diseaseHistory}
                setDiseaseHistory={setDiseaseHistory}
                loadCropData={loadCropData}
              />
            ) : activeFeature === 'weather' ? (
              <WeatherFeature selectedCrop={selectedCrop} />
            ) : activeFeature === 'activity' ? (
              <ActivityLogFeature selectedCrop={selectedCrop} />
            ) : activeFeature === 'costs' ? (
              <div className="w-full h-full p-6">
                <CostTracker cropId={selectedCrop.id} cropName={selectedCrop.name} />
              </div>
            ) : (
              <div className="w-full max-w-2xl">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const feature = features.find(f => f.id === activeFeature)
                      if (feature) {
                        const Icon = feature.icon
                        return <Icon className="h-8 w-8 text-gray-500" />
                      }
                      return null
                    })()}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {features.find(f => f.id === activeFeature)?.name}
                  </h3>
                  <p className="text-gray-500">
                    This feature is coming soon! We'll integrate it with the backend.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Sprout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a crop to get started
            </h3>
            <p className="text-gray-500">
              Choose a crop from the sidebar to access farming tools
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CropMainPanelSimple