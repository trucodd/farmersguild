import { useState, useEffect } from 'react'
import { Camera, Upload, ArrowLeft, Shield, Pill, Send, Bot, User, Trash2 } from 'lucide-react'
import { api } from '../../utils/api'
import MarkdownRenderer from '../ui/MarkdownRenderer'

const DiseaseDetectionFeature = ({ selectedCrop, diseaseHistory, setDiseaseHistory, loadCropData }) => {
  const [currentPrediction, setCurrentPrediction] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPrecautions, setShowPrecautions] = useState(false)
  const [showTreatment, setShowTreatment] = useState(false)
  const [diseaseView, setDiseaseView] = useState('history')
  const [chatMessages, setChatMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isLoadingPrecautions, setIsLoadingPrecautions] = useState(false)
  const [isLoadingTreatment, setIsLoadingTreatment] = useState(false)



  const handleDeleteDetection = async (detectionId) => {
    try {
      const response = await api.deleteDiseaseDetection(detectionId)
      if (response.ok) {
        // Reload data from backend
        await loadCropData(selectedCrop.id)
        
        // If deleted item was currently selected, go back to history
        if (currentPrediction && currentPrediction.id === detectionId) {
          setCurrentPrediction(null)
          setDiseaseView('history')
        }
      }
    } catch (error) {
      console.error('Error deleting detection:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        setIsAnalyzing(true)
        setDiseaseView('result')
        
        try {
          const imageBase64 = e.target.result.split(',')[1] // Remove data:image/jpeg;base64, prefix
          
          console.log('=== DISEASE ANALYSIS REQUEST ===')
          console.log('Crop ID:', selectedCrop.id)
          console.log('Image data length:', imageBase64.length)
          console.log('Token present:', !!localStorage.getItem('token'))
          
          const response = await api.analyzeDisease(imageBase64, selectedCrop.id)
          
          console.log('Response status:', response.status)
          console.log('Response ok:', response.ok)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Error response:', errorText)
            throw new Error(`Failed to analyze image: ${response.status} - ${errorText}`)
          }
          
          const result = await response.json()
          
          console.log('=== AI ANALYSIS RESULT ===')
          console.log('Full result:', result)
          console.log('Precautions:', result.precautions)
          console.log('Treatment:', result.treatment)
          
          const prediction = {
            id: result.detection_id,
            detection_id: result.detection_id,
            image: e.target.result,
            disease: result.disease,
            cause: result.cause,
            confidence: result.confidence,
            severity: result.severity,
            timestamp: new Date(),
            precautions: result.precautions || 'No precautions available',
            treatment: result.treatment || 'No treatment available'
          }
          
          setCurrentPrediction(prediction)
          await loadCropData(selectedCrop.id)
          setIsAnalyzing(false)
          
          // Initialize chat with AI-generated welcome message
          try {
            const welcomeResponse = await api.chatAboutDisease(
              result.detection_id,
              `I just analyzed an image and detected ${result.disease}. Please provide a welcome message and brief explanation.`
            )
            
            if (welcomeResponse.ok) {
              const welcomeResult = await welcomeResponse.json()
              setChatMessages([{
                id: Date.now(),
                type: 'bot',
                content: welcomeResult.response,
                timestamp: new Date()
              }])
            }
          } catch (error) {
            console.error('Error getting welcome message:', error)
            setChatMessages([{
              id: Date.now(),
              type: 'bot',
              content: `Analysis complete. Feel free to ask me any questions!`,
              timestamp: new Date()
            }])
          }
        } catch (error) {
          console.error('Error analyzing image:', error)
          setIsAnalyzing(false)
          
          alert(`Failed to analyze image: ${error.message}`)
          setDiseaseView('upload')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const selectPrediction = (prediction) => {
    setCurrentPrediction(prediction)
    setDiseaseView('result')
    setShowPrecautions(false)
    setShowTreatment(false)
    
    // Load chat history for this disease detection
    const loadChatHistory = async () => {
      try {
        const chatHistoryResponse = await api.getDiseaseChatHistory(prediction.detection_id || prediction.id)
        if (chatHistoryResponse.ok) {
          const chatData = await chatHistoryResponse.json()
          const messages = []
          chatData.chat_history.forEach(chat => {
            messages.push({ id: `user-${chat.id}`, type: 'user', content: chat.message, timestamp: new Date(chat.created_at) })
            messages.push({ id: `bot-${chat.id}`, type: 'bot', content: chat.response, timestamp: new Date(chat.created_at) })
          })
          setChatMessages(messages)
        } else {
          // If no chat history, show welcome message
          setChatMessages([{
            id: Date.now(),
            type: 'bot',
            content: `Welcome back! I can help you with questions about ${prediction.disease}. What would you like to know?`,
            timestamp: new Date()
          }])
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        setChatMessages([{
          id: Date.now(),
          type: 'bot',
          content: `Welcome back! What would you like to know about ${prediction.disease}?`,
          timestamp: new Date()
        }])
      }
    }
    
    loadChatHistory()
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoadingChat) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsLoadingChat(true)

    try {
      const response = await api.chatAboutDisease(
        currentPrediction.detection_id || currentPrediction.id,
        messageToSend
      )
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }
      
      const result = await response.json()
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.response,
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I'm having trouble processing your question about ${currentPrediction.disease}. Please try asking again or consult with a local agricultural expert for immediate assistance.`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoadingChat(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {diseaseView === 'history' ? (
        <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-text-primary">Disease Detection History</h3>
            <button
              onClick={() => setDiseaseView('upload')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>Upload Image</span>
            </button>
          </div>
          
          {diseaseHistory.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-text-primary mb-2">No images analyzed yet</h4>
              <p className="text-text-secondary mb-4">Upload your first crop image for disease detection</p>
              <button
                onClick={() => setDiseaseView('upload')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {diseaseHistory.map((prediction) => (
                <div
                  key={prediction.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => selectPrediction(prediction)}>
                      <p className="font-semibold text-gray-900">
                        Result: {prediction.disease}
                      </p>
                      <p className="text-sm text-gray-600">
                        Severity: {prediction.severity}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {prediction.timestamp.toLocaleDateString()} at {prediction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {prediction.confidence}% confidence
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Click to chat</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDetection(prediction.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete detection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : diseaseView === 'upload' ? (
        <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setDiseaseView('history')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-text-primary">Upload Crop Image</h3>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-text-primary mb-2">Upload {selectedCrop.name} Image</h4>
              <p className="text-text-secondary mb-6">Take a clear photo of leaves, fruits, or affected plant parts</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="disease-image-upload"
              />
              <label
                htmlFor="disease-image-upload"
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Choose Image</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setDiseaseView('history')}
                className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-text-primary" />
              </button>
              <h3 className="text-lg font-semibold text-text-primary">Analysis Result</h3>
            </div>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your {selectedCrop.name} image...</p>
              </div>
            ) : currentPrediction && (
              <div>
                <div className="bg-white/90 backdrop-blur-sm border border-accent-sage/30 rounded-lg p-3 mb-3">
                  <p className="text-text-primary font-medium text-sm">
                    Analysis Result: {currentPrediction.disease} – {currentPrediction.cause}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {currentPrediction && !isAnalyzing && (
            <div className="grid lg:grid-cols-3 gap-6 p-6">
              {/* Left Panel - Image and Options */}
              <div className="lg:col-span-1 space-y-6">
                {/* Image Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Analysis Image</h3>
                  <img
                    src={currentPrediction.image}
                    alt="Analyzed crop"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    Analyzed: {currentPrediction.timestamp.toLocaleDateString()}
                  </p>
                </div>
                
                {/* AI Recommendations Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
                  <div className="text-xs text-gray-500 mb-2">Debug: showPrecautions={showPrecautions.toString()}, showTreatment={showTreatment.toString()}</div>
                  <select
                    onChange={async (e) => {
                      console.log('=== DROPDOWN SELECTION ===')
                      console.log('Selected:', e.target.value)
                      console.log('Current prediction:', currentPrediction)
                      
                      if (e.target.value === 'precautions') {
                        setShowPrecautions(true)
                        setShowTreatment(false)
                        setIsLoadingPrecautions(true)
                        
                        try {
                          console.log('Calling AI for precautions...')
                          const response = await api.chatAboutDisease(
                            currentPrediction.detection_id || currentPrediction.id,
                            `What are the detailed precautions for ${currentPrediction.disease}?`
                          )
                          console.log('Precautions response:', response.status)
                          
                          if (response.ok) {
                            const data = await response.json()
                            console.log('Precautions data:', data)
                            setCurrentPrediction(prev => ({
                              ...prev,
                              precautions: data.response
                            }))
                          }
                        } catch (error) {
                          console.error('Error getting precautions:', error)
                        } finally {
                          setIsLoadingPrecautions(false)
                        }
                      } else if (e.target.value === 'treatment') {
                        setShowTreatment(true)
                        setShowPrecautions(false)
                        setIsLoadingTreatment(true)
                        
                        try {
                          console.log('Calling AI for treatment...')
                          const response = await api.chatAboutDisease(
                            currentPrediction.detection_id || currentPrediction.id,
                            `What are the detailed treatment options for ${currentPrediction.disease}?`
                          )
                          console.log('Treatment response:', response.status)
                          
                          if (response.ok) {
                            const data = await response.json()
                            console.log('Treatment data:', data)
                            setCurrentPrediction(prev => ({
                              ...prev,
                              treatment: data.response
                            }))
                          }
                        } catch (error) {
                          console.error('Error getting treatment:', error)
                        } finally {
                          setIsLoadingTreatment(false)
                        }
                      } else {
                        setShowPrecautions(false)
                        setShowTreatment(false)
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                  >
                    <option value="">Select recommendation type</option>
                    <option value="precautions">Precautions</option>
                    <option value="treatment">Treatment</option>
                  </select>
                  
                  {showPrecautions ? (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-semibold text-yellow-800">Prevention Steps</h4>
                      </div>
                      {isLoadingPrecautions ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-600">Getting AI recommendations...</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {currentPrediction?.precautions || 'No precautions data available'}
                        </div>
                      )}
                    </div>
                  ) : showTreatment ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Pill className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">Treatment Options</h4>
                      </div>
                      {isLoadingTreatment ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-600">Getting AI recommendations...</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {currentPrediction?.treatment || 'No treatment data available'}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* Right Panel - Chat Interface */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md" style={{height: 'calc(100vh - 200px)'}}>
                  <div className="flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/20">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-accent-meadow" />
                        <h3 className="text-lg font-semibold text-text-primary">Disease Assistant</h3>
                      </div>
                      <p className="text-sm text-text-secondary">Ask questions about {currentPrediction.disease}</p>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start space-x-2 max-w-md ${
                            message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user' ? 'bg-accent-sage' : 'bg-accent-meadow'
                            }`}>
                              {message.type === 'user' ? (
                                <User className="h-4 w-4 text-white" />
                              ) : (
                                <Bot className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className={`rounded-lg px-3 py-2 ${
                              message.type === 'user' ? 'bg-accent-sage text-white' : 'glass-card border border-white/10'
                            }`}>
                              <div className={`text-sm font-medium mb-1 ${
                                message.type === 'user' ? 'text-white/90' : 'text-text-secondary'
                              }`}>
                                {message.type === 'user' ? 'You' : 'Assistant'}
                              </div>
                              <div className={message.type === 'user' ? 'text-white' : 'text-text-primary'}>
                                {message.type === 'user' ? (
                                  <p>{message.content}</p>
                                ) : (
                                  <MarkdownRenderer content={message.content} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoadingChat && (
                        <div className="flex justify-start">
                          <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 rounded-full bg-accent-meadow flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="glass-card border border-white/10 rounded-lg px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin w-3 h-3 border-2 border-accent-meadow border-t-transparent rounded-full"></div>
                                <span className="text-sm text-text-secondary">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Input */}
                    <div className="p-4 border-t border-white/20">
                      <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Ask about this disease..."
                          className="flex-1 px-4 py-2 text-sm glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary"
                          disabled={isLoadingChat}
                        />
                        <button
                          type="submit"
                          disabled={!inputMessage.trim() || isLoadingChat}
                          className="bg-accent-meadow text-white px-4 py-2 rounded-lg hover:bg-accent-meadow/80 transition-colors disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiseaseDetectionFeature