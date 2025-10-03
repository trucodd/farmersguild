import { useState, useEffect } from 'react'
import { Camera, Upload, ArrowLeft, Shield, Pill, Send, Bot, User, Trash2 } from 'lucide-react'

const DiseaseDetectionFeature = ({ selectedCrop }) => {
  const [diseaseHistory, setDiseaseHistory] = useState([])
  const [currentPrediction, setCurrentPrediction] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPrecautions, setShowPrecautions] = useState(false)
  const [showTreatment, setShowTreatment] = useState(false)
  const [diseaseView, setDiseaseView] = useState('history')
  const [chatMessages, setChatMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(`diseaseHistory_${selectedCrop.id}`)
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory)
      // Convert timestamp strings back to Date objects
      const historyWithDates = parsedHistory.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
      setDiseaseHistory(historyWithDates)
    }
  }, [selectedCrop.id])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (diseaseHistory.length > 0) {
      localStorage.setItem(`diseaseHistory_${selectedCrop.id}`, JSON.stringify(diseaseHistory))
    }
  }, [diseaseHistory, selectedCrop.id])

  const deletePrediction = (predictionId) => {
    const updatedHistory = diseaseHistory.filter(item => item.id !== predictionId)
    setDiseaseHistory(updatedHistory)
    
    // Update localStorage
    if (updatedHistory.length === 0) {
      localStorage.removeItem(`diseaseHistory_${selectedCrop.id}`)
    } else {
      localStorage.setItem(`diseaseHistory_${selectedCrop.id}`, JSON.stringify(updatedHistory))
    }
    
    // If deleted item was currently selected, go back to history
    if (currentPrediction && currentPrediction.id === predictionId) {
      setCurrentPrediction(null)
      setDiseaseView('history')
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setIsAnalyzing(true)
        setDiseaseView('result')
        
        setTimeout(() => {
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
          setDiseaseHistory(prev => [prediction, ...prev])
          setIsAnalyzing(false)
          
          // Initialize chat with disease context
          setChatMessages([{
            id: Date.now(),
            type: 'bot',
            content: `I've detected ${prediction.disease} in your ${selectedCrop.name}. This is typically caused by ${prediction.cause}. Feel free to ask me any questions about this disease or how to manage it!`,
            timestamp: new Date()
          }])
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
    
    // Restore chat for this prediction
    setChatMessages([{
      id: Date.now(),
      type: 'bot',
      content: `Welcome back! I previously detected ${prediction.disease} in your ${selectedCrop.name}. What would you like to know about this disease?`,
      timestamp: new Date()
    }])
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoadingChat) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoadingChat(true)

    // Simulate AI response with disease context
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Regarding ${currentPrediction.disease} in your ${selectedCrop.name}: This disease typically spreads in ${currentPrediction.cause} conditions. I recommend monitoring your crop closely and applying the treatments we discussed. Would you like specific guidance on timing or application methods?`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, botResponse])
      setIsLoadingChat(false)
    }, 1500)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {diseaseView === 'history' ? (
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Disease Detection History</h3>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No images analyzed yet</h4>
              <p className="text-gray-500 mb-4">Upload your first crop image for disease detection</p>
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
                    <img
                      src={prediction.image}
                      alt="Crop analysis"
                      className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                      onClick={() => selectPrediction(prediction)}
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => selectPrediction(prediction)}>
                      <p className="font-semibold text-gray-900">
                        Disease: {prediction.disease}
                      </p>
                      <p className="text-sm text-gray-600">
                        Caused by {prediction.cause}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {prediction.timestamp.toLocaleDateString()} at {prediction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-sm font-medium text-red-600">
                          {prediction.confidence}% confidence
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePrediction(prediction.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete analysis"
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
        <div className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setDiseaseView('history')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900">Upload Crop Image</h3>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload {selectedCrop.name} Image</h4>
              <p className="text-gray-600 mb-6">Take a clear photo of leaves, fruits, or affected plant parts</p>
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
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">Analysis Result</h3>
            </div>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your {selectedCrop.name} image...</p>
              </div>
            ) : currentPrediction && (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">
                    Disease: {currentPrediction.disease} – Caused by {currentPrediction.cause}.
                  </p>
                </div>
                
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={() => {
                      setShowPrecautions(!showPrecautions)
                      setShowTreatment(false)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors flex items-center justify-center space-x-2 ${
                      showPrecautions 
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-300 hover:border-yellow-400 text-gray-700'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Precautions</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowTreatment(!showTreatment)
                      setShowPrecautions(false)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors flex items-center justify-center space-x-2 ${
                      showTreatment 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400 text-gray-700'
                    }`}
                  >
                    <Pill className="h-4 w-4" />
                    <span>Treatment</span>
                  </button>
                </div>
                
                {(showPrecautions || showTreatment) && (
                  <div className={`border rounded-lg p-4 ${
                    showPrecautions ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      showPrecautions ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {showPrecautions ? 'Prevention Steps' : 'Treatment Options'}
                    </h4>
                    <ul className="space-y-2">
                      {(showPrecautions ? currentPrediction.precautions : currentPrediction.treatment).map((item, index) => (
                        <li key={index} className={`flex items-start space-x-2 ${
                          showPrecautions ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-current mt-2 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {currentPrediction && !isAnalyzing && (
            <div className="flex-1 flex">
              {/* Left: Small Image */}
              <div className="w-1/3 p-4">
                <img
                  src={currentPrediction.image}
                  alt="Analyzed crop"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Analyzed: {currentPrediction.timestamp.toLocaleDateString()}
                </p>
              </div>
              
              {/* Right: Chat Interface */}
              <div className="flex-1 flex flex-col border-l border-gray-200">
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 bg-red-50">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Disease Assistant</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">Ask questions about {currentPrediction.disease}</p>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-xs ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-3 w-3 text-white" />
                          ) : (
                            <Bot className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className={`rounded-lg px-3 py-2 text-sm ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p>{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            <span className="text-xs text-gray-600">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Input */}
                <div className="p-3 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask about this disease..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={isLoadingChat}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoadingChat}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
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