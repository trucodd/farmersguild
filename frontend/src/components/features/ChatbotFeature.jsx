import { useState, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

const ChatbotFeature = ({ crop }) => {
  const [messages, setMessages] = useState([])
  
  // Reset messages when crop changes
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `Hello! I'm here to help with your ${crop.name} crop. What would you like to know?`,
        timestamp: new Date()
      }
    ])
  }, [crop.id, crop.name])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Get real AI response
    const getAIResponse = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('token')
        console.log('Sending chat request:', { content: inputMessage, crop_id: crop.id })
        
        const response = await fetch('http://localhost:8000/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: inputMessage,
            crop_id: crop.id
          })
        })
        
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('AI Response:', data)
          const botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            content: data.content,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, botResponse])
        } else {
          const errorText = await response.text()
          console.error('API Error:', response.status, errorText)
          throw new Error(`API Error: ${response.status}`)
        }
      } catch (error) {
        console.error('Error getting AI response:', error)
        const errorResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Sorry, I'm having trouble responding right now. Error: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorResponse])
      } finally {
        setIsLoading(false)
      }
    }
    
    getAIResponse()
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-green-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Crop Assistant</h3>
            <p className="text-sm text-gray-600">Specialized for {crop.name} farming</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask about your ${crop.name}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatbotFeature