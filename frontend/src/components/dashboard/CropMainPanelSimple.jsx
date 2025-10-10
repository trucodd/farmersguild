import { useState, useRef, useEffect } from 'react'
import { Sprout, ChevronLeft, ChevronRight, MessageSquare, Camera, Cloud, TrendingUp, FileText, Send, Bot, User, ArrowLeft } from 'lucide-react'
import DiseaseDetectionFeature from './DiseaseDetectionFeature'
import WeatherFeature from './WeatherFeature'
import ActivityLogFeature from './ActivityLogFeature'
import CostTracker from '../costs/CostTracker'
import { api } from '../../utils/api'

const CropMainPanelSimple = ({ selectedCrop, onBackToSidebar, showBackButton }) => {
  const [activeFeature, setActiveFeature] = useState('overview')
  
  // Update activeFeature when selectedCrop.feature changes
  useEffect(() => {
    if (selectedCrop?.feature) {
      setActiveFeature(selectedCrop.feature)
    } else {
      setActiveFeature('overview')
    }
  }, [selectedCrop?.feature])
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
          cause: detection.cause || 'detected via AI analysis',
          precautions: detection.precautions || [],
          treatment: detection.treatment || []
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
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        setIsAnalyzing(true)
        setDiseaseView('result')
        
        try {
          // Call AI backend for disease analysis
          const imageBase64 = e.target.result.split(',')[1] // Remove data:image/jpeg;base64, prefix
          const response = await api.analyzeDisease(imageBase64, selectedCrop.id)
          
          if (response.ok) {
            const data = await response.json()
            
            // Get AI-generated precautions and treatment
            const precautionsResponse = await api.chatAboutDisease(data.detection_id, `What are the precautions for ${data.disease_name}?`)
            const treatmentResponse = await api.chatAboutDisease(data.detection_id, `What are the treatment options for ${data.disease_name}?`)
            
            let precautions = []
            let treatment = []
            
            if (precautionsResponse.ok) {
              const precautionsData = await precautionsResponse.json()
              precautions = precautionsData.response.split('\n').filter(line => line.trim())
            }
            
            if (treatmentResponse.ok) {
              const treatmentData = await treatmentResponse.json()
              treatment = treatmentData.response.split('\n').filter(line => line.trim())
            }
            
            const prediction = {
              id: data.detection_id,
              detection_id: data.detection_id,
              image: e.target.result,
              disease: data.disease_name,
              cause: data.cause || 'detected via AI analysis',
              confidence: data.confidence,
              severity: data.severity,
              timestamp: new Date(data.detected_at),
              precautions,
              treatment
            }
            
            setCurrentPrediction(prediction)
            // Reload disease history from backend
            await loadCropData(selectedCrop.id)
          } else {
            console.error('Disease analysis failed:', await response.text())
          }
        } catch (error) {
          console.error('Error analyzing disease:', error)
        } finally {
          setIsAnalyzing(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const selectPrediction = async (prediction) => {
    setCurrentPrediction(prediction)
    setDiseaseView('result')
    setShowPrecautions(false)
    setShowTreatment(false)
    
    // If precautions or treatment are empty, get them from AI
    if ((!prediction.precautions || prediction.precautions.length === 0) || 
        (!prediction.treatment || prediction.treatment.length === 0)) {
      try {
        let updatedPrediction = { ...prediction }
        
        if (!prediction.precautions || prediction.precautions.length === 0) {
          const precautionsResponse = await api.chatAboutDisease(prediction.detection_id, `What are the precautions for ${prediction.disease}?`)
          if (precautionsResponse.ok) {
            const precautionsData = await precautionsResponse.json()
            updatedPrediction.precautions = precautionsData.response.split('\n').filter(line => line.trim())
          }
        }
        
        if (!prediction.treatment || prediction.treatment.length === 0) {
          const treatmentResponse = await api.chatAboutDisease(prediction.detection_id, `What are the treatment options for ${prediction.disease}?`)
          if (treatmentResponse.ok) {
            const treatmentData = await treatmentResponse.json()
            updatedPrediction.treatment = treatmentData.response.split('\n').filter(line => line.trim())
          }
        }
        
        setCurrentPrediction(updatedPrediction)
      } catch (error) {
        console.error('Error getting AI recommendations:', error)
      }
    }
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
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10">



      {/* Content Area */}
      <div className={`flex-1 ${activeFeature === 'chatbot' ? 'flex flex-col h-0' : activeFeature === 'disease' || activeFeature === 'weather' || activeFeature === 'activity' || activeFeature === 'costs' ? 'flex flex-col' : 'flex items-center justify-center'}`}>
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
              <div className="flex flex-col min-h-screen" style={{height: 'calc(100vh - 80px)'}}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col-reverse" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {messages.length === 0 && initializeChat()}
                  {[...messages].reverse().map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-4 max-w-lg ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-accent-sage' : 'bg-accent-meadow'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-5 w-5 text-white" />
                          ) : (
                            <Bot className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className={`rounded-2xl px-6 py-4 ${
                          message.type === 'user' 
                            ? 'bg-accent-sage text-white' 
                            : 'glass-card text-text-primary border border-white/10'
                        }`}>
                          <p style={{whiteSpace: 'pre-wrap'}}>{message.content.replace(/[*#`]/g, '')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-accent-meadow flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="glass-card rounded-2xl px-6 py-4 border border-white/10">
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin w-5 h-5 border-2 border-accent-meadow border-t-transparent rounded-full"></div>
                            <span className="text-text-secondary">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 border-t border-white/10 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Ask about your ${selectedCrop.name}...`}
                      className="flex-1 px-4 py-3 glass-card text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-orange border border-white/10"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-accent-meadow text-white p-3 rounded-lg hover:bg-accent-meadow/80 transition-colors disabled:opacity-50"
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
              <CostTracker cropId={selectedCrop.id} cropName={selectedCrop.name} />
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
            <Sprout className="h-20 w-20 text-text-secondary mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-text-primary mb-4">
              SELECT A CROP TO GET STARTED
            </h3>
            <p className="text-text-secondary text-lg">
              Choose a crop from the sidebar to access farming tools
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CropMainPanelSimple