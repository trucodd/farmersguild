import { useState, useEffect } from 'react'
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUserStats } from '../hooks/useUserStats'

const Dashboard = () => {
  const { stats: realStats, loading } = useUserStats()
  const [stats, setStats] = useState({
    totalCrops: 0,
    aiConsultations: 0,
    marketAlerts: 5,
    costSavings: '₹0'
  })

  useEffect(() => {
    if (!loading && realStats) {
      setStats({
        totalCrops: realStats.active_crops,
        aiConsultations: realStats.ai_consultations,
        marketAlerts: 5, // Keep static for now
        costSavings: `₹${Math.round(realStats.cost_savings)}`
      })
    }
  }, [realStats, loading])

  const recentActivities = [
    { id: 1, type: 'chat', message: 'AI crop consultation for wheat disease detection', time: '2 hours ago' },
    { id: 2, type: 'market', message: 'Rice prices increased by 3% - Good time to sell', time: '4 hours ago' },
    { id: 3, type: 'weather', message: 'Weather alert: Heavy rain expected next week', time: '6 hours ago' },
    { id: 4, type: 'cost', message: 'Cost tracking updated for fertilizer expenses', time: '8 hours ago' }
  ]

  const upcomingTasks = [
    { id: 1, task: 'Check wheat crop for disease symptoms', date: 'Tomorrow', priority: 'high' },
    { id: 2, task: 'Review market prices for rice selling', date: 'Dec 15', priority: 'medium' },
    { id: 3, task: 'Update labor cost records', date: 'Dec 18', priority: 'medium' },
    { id: 4, task: 'Weather monitoring for irrigation', date: 'Dec 20', priority: 'low' }
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-2">FARM DASHBOARD</h1>
            <p className="text-text-secondary text-base sm:text-lg">Monitor your agricultural operations and AI-powered insights</p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Left Column - Large Feature Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lg:col-span-2 relative overflow-hidden rounded-xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
            >
              <div className="absolute inset-0 bg-black/15"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">FARM OVERVIEW</h2>
                    <p className="text-white/90 text-sm sm:text-base">Real-time insights and analytics</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-accent-meadow" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-meadow mb-1 sm:mb-2">{stats.totalCrops}</div>
                    <div className="text-white/90 font-medium text-xs sm:text-sm">Active Crops</div>
                  </div>
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-sage mb-1 sm:mb-2">{stats.aiConsultations}</div>
                    <div className="text-white/90 font-medium text-xs sm:text-sm">AI Consultations</div>
                  </div>
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-olive mb-1 sm:mb-2">{stats.marketAlerts}</div>
                    <div className="text-white/90 font-medium text-xs sm:text-sm">Market Alerts</div>
                  </div>
                  <div className="text-center bg-black/40 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent-meadow mb-1 sm:mb-2">{stats.costSavings}</div>
                    <div className="text-white/90 font-medium text-xs sm:text-sm">Cost Savings</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-accent-sage/25 via-accent-olive/20 to-accent-meadow/15 backdrop-blur-md border border-white/30 shadow-xl"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6">QUICK ACTIONS</h3>
              <div className="space-y-4">
                <button className="w-full glass-card p-4 hover:bg-white/10 transition-all text-left">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-accent-orange" />
                    <div>
                      <div className="font-medium text-text-primary">AI Consultation</div>
                      <div className="text-sm text-text-secondary">Get crop advice</div>
                    </div>
                  </div>
                </button>
                <button className="w-full glass-card p-4 hover:bg-white/10 transition-all text-left">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-6 w-6 text-accent-green" />
                    <div>
                      <div className="font-medium text-text-primary">Market Prices</div>
                      <div className="text-sm text-text-secondary">Check rates</div>
                    </div>
                  </div>
                </button>
                <button className="w-full glass-card p-4 hover:bg-white/10 transition-all text-left">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-accent-teal" />
                    <div>
                      <div className="font-medium text-text-primary">Weather</div>
                      <div className="text-sm text-text-secondary">7-day forecast</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-green-600/20 via-emerald-600/15 to-teal-700/20 backdrop-blur-md border border-white/30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">RECENT ACTIVITIES</h2>
                <Bell className="h-6 w-6 text-accent-green" />
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all">
                    <div className="flex-shrink-0">
                      {activity.type === 'chat' && <MessageSquare className="h-5 w-5 text-accent-orange" />}
                      {activity.type === 'market' && <TrendingUp className="h-5 w-5 text-accent-green" />}
                      {activity.type === 'weather' && <Calendar className="h-5 w-5 text-accent-teal" />}
                      {activity.type === 'cost' && <BarChart3 className="h-5 w-5 text-accent-orange" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium">{activity.message}</p>
                      <p className="text-text-secondary text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Tasks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-lime-600/20 via-green-700/15 to-emerald-800/20 backdrop-blur-md border border-white/30 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">UPCOMING TASKS</h2>
                <Calendar className="h-6 w-6 text-accent-teal" />
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary text-sm">{task.task}</p>
                      <p className="text-text-secondary text-xs mt-1">{task.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high' ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30' :
                      task.priority === 'medium' ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30' :
                      'bg-accent-green/20 text-accent-green border border-accent-green/30'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard