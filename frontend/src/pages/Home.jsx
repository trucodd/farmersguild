import { Link } from 'react-router-dom'
import { Sprout, Users, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlatformStats } from '../hooks/usePlatformStats'

const Home = () => {
  const { stats, loading } = usePlatformStats()
  
  const features = [
    {
      icon: <MessageSquare className="h-12 w-12 text-accent-orange" />,
      title: "AI-Powered Crop Assistant",
      description: "Get intelligent farming advice with crop-specific recommendations and disease detection using advanced AI"
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-accent-green" />,
      title: "Market Price Analytics",
      description: "Real-time commodity prices, market trends, and insights to optimize your selling decisions"
    },
    {
      icon: <Users className="h-12 w-12 text-accent-teal" />,
      title: "Farm Management Tools",
      description: "Track crops, manage costs, monitor weather, and organize labor with comprehensive dashboard analytics"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">

        <div className="absolute inset-0 opacity-80">
          <div className="grid grid-cols-3 h-full gap-2">
            <div className="bg-cover bg-center" style={{backgroundImage: 'url(/images/modern-farming.jpg)'}}></div>
            <div className="bg-cover bg-center" style={{backgroundImage: 'url(/images/crop-fields.jpg)'}}></div>
            <div className="bg-cover bg-center" style={{backgroundImage: 'url(/images/harvest-scene.jpg)'}}></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex items-center min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              >
                <div className="flex items-center mb-6">
                  <Sprout className="h-12 w-12 text-accent-meadow mr-4" />
                  <span className="text-2xl font-bold text-white">FARMERS GUILD</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  AI-Powered <span className="text-accent-meadow">Farm Management</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
                  Transform your farming with intelligent crop monitoring, market insights, and data-driven decisions.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link to="/register" className="accent-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 text-center">
                    Get Started
                  </Link>
                  <Link to="/chat" className="glass-card border border-accent-sage text-accent-sage px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-accent-sage/10 transition-all text-center">
                    Try AI Assistant
                  </Link>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative overflow-hidden rounded-xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
              >
                <div className="absolute inset-0 bg-black/15"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-sage/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Platform Overview</h3>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-meadow mb-1 sm:mb-2">{loading ? '...' : stats.ai_consultations}</div>
                      <div className="text-white/90 text-xs sm:text-sm font-medium">AI Consultations</div>
                    </div>
                    <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-sage mb-1 sm:mb-2">{loading ? '...' : stats.active_crops}</div>
                      <div className="text-white/90 text-xs sm:text-sm font-medium">Active Crops</div>
                    </div>
                    <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-olive mb-1 sm:mb-2">{loading ? '...' : `₹${Math.round(stats.cost_savings)}`}</div>
                      <div className="text-white/90 text-xs sm:text-sm font-medium">Cost Savings</div>
                    </div>
                    <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-accent-meadow mb-1 sm:mb-2">{loading ? '...' : `${stats.accuracy_rate}%`}</div>
                      <div className="text-white/90 text-xs sm:text-sm font-medium">Accuracy Rate</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              COMPREHENSIVE FARM MANAGEMENT
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-text-secondary">
              Everything you need to optimize your agricultural operations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="glass-card p-4 sm:p-6 lg:p-8 bg-cover bg-center relative overflow-hidden"
              style={{backgroundImage: 'url(/images/modern-farming.jpg)'}}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <MessageSquare className="h-16 w-16 text-accent-meadow mb-6" />
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                  AI-POWERED INSIGHTS
                </h3>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                  Get intelligent crop recommendations, disease detection, and personalized farming advice.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-accent-meadow">{loading ? '...' : stats.ai_consultations}</div>
                    <div className="text-sm text-white/90 font-medium">Consultations</div>
                  </div>
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-accent-meadow">{loading ? '...' : `${stats.accuracy_rate}%`}</div>
                    <div className="text-sm text-white/90 font-medium">Accuracy</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-green-600/20 via-emerald-600/15 to-teal-700/20 backdrop-blur-md border border-white/30 shadow-xl"
              >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/15 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-start space-x-4">
                    <TrendingUp className="h-12 w-12 text-accent-meadow flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        MARKET ANALYTICS
                      </h3>
                      <p className="text-white/90">
                        Real-time commodity prices and market trends to optimize selling decisions.
                      </p>
                      <div className="mt-4 flex space-x-6">
                        <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-lg font-bold text-accent-meadow">₹2,340</div>
                          <div className="text-sm text-white/90 font-medium">Rice/Quintal</div>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-lg font-bold text-accent-meadow">+3.2%</div>
                          <div className="text-sm text-white/90 font-medium">This Week</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-lime-600/20 via-green-700/15 to-emerald-800/20 backdrop-blur-md border border-white/30 shadow-xl"
              >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-500/15 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <div className="flex items-start space-x-4">
                    <Users className="h-12 w-12 text-accent-sage flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        FARM OPERATIONS
                      </h3>
                      <p className="text-white/90">
                        Track crops, manage costs, monitor weather, and organize labor efficiently.
                      </p>
                      <div className="mt-4 flex space-x-6">
                        <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-lg font-bold text-accent-sage">{loading ? '...' : stats.active_crops}</div>
                          <div className="text-sm text-white/90 font-medium">Active Crops</div>
                        </div>
                        <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                          <div className="text-lg font-bold text-accent-sage">{loading ? '...' : `₹${Math.round(stats.cost_savings)}`}</div>
                          <div className="text-sm text-white/90 font-medium">Saved</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-meadow to-accent-sage">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              START YOUR SMART FARMING JOURNEY
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join farmers who are already optimizing their operations with AI
            </p>
            <Link
              to="/register"
              className="bg-white text-accent-meadow px-10 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all inline-flex items-center space-x-2"
            >
              <span>Get Started Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home