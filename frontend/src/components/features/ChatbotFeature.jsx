import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Bot, User } from 'lucide-react'
import MarkdownRenderer from '../ui/MarkdownRenderer'

const ChatbotFeature = ({ crop }) => {
  const [messages, setMessages] = useState([])
  const [, forceUpdate] = useState({})
  const messagesEndRef = useRef(null)
  const forceRerender = useCallback(() => forceUpdate({}), [])
  
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const messageContent = inputMessage
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      console.log('Added user message:', newMessages)
      setTimeout(forceRerender, 0)
      return newMessages
    })
    setInputMessage('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      console.log('Sending chat request:', { content: messageContent, crop_id: crop.id })
      
      const response = await fetch('http://localhost:8000/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageContent,
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
        setMessages(prev => {
          const newMessages = [...prev, botResponse]
          console.log('Updated messages:', newMessages)
          setTimeout(forceRerender, 0)
          return newMessages
        })
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
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
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
                {message.type === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask about your ${crop.name}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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