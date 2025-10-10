import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI farming assistant. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    const messageContent = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: messageContent })
      })

      if (response.ok) {
        const data = await response.json()
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botResponse])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }



  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-card rounded-2xl shadow-xl overflow-hidden border border-white/20"
        >
          {/* Chat Header */}
          <div className="relative overflow-hidden px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border-b border-white/20">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex items-center space-x-3">
              <div className="bg-accent-meadow/20 rounded-full p-2">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent-meadow" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-text-primary">AI FARMING ASSISTANT</h1>
                <p className="text-text-secondary text-xs sm:text-sm">Always here to help with your farming questions</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-64 sm:h-80 lg:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 sm:space-x-3 max-w-xs sm:max-w-sm lg:max-w-md ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-accent-sage' : 'bg-accent-meadow'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                      message.type === 'user' 
                        ? 'bg-accent-sage text-white' 
                        : 'glass-card border border-white/10 text-text-primary'
                    }`}>
                      <p className="text-xs sm:text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-white/80' : 'text-text-secondary'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-meadow flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="glass-card border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader className="h-4 w-4 animate-spin text-accent-meadow" />
                      <span className="text-sm text-text-secondary">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-white/20 p-4 sm:p-6">
            <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about farming..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 glass-card border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-accent-meadow text-white p-2 sm:p-3 rounded-xl hover:bg-accent-meadow/80 focus:outline-none focus:ring-2 focus:ring-accent-meadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </form>
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
              {['Crop rotation tips', 'Soil health', 'Weather forecast', 'Market prices'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputMessage(suggestion)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm glass-card border border-white/10 text-text-secondary rounded-full hover:bg-white/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Chat