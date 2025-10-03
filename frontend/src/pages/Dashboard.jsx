import { useState, useEffect } from 'react'
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar, Bell } from 'lucide-react'
import { motion } from 'framer-motion'


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFarms: 156,
    activeCommunity: 1240,
    aiInteractions: 89,
    marketTrends: '+12.5%'
  })

  const recentActivities = [
    { id: 1, type: 'chat', message: 'AI consultation about crop rotation', time: '2 hours ago' },
    { id: 2, type: 'community', message: 'New post in Organic Farming group', time: '4 hours ago' },
    { id: 3, type: 'market', message: 'Corn prices increased by 3%', time: '6 hours ago' },
    { id: 4, type: 'weather', message: 'Rain forecast for next week', time: '8 hours ago' }
  ]

  const upcomingTasks = [
    { id: 1, task: 'Fertilizer application', date: 'Tomorrow', priority: 'high' },
    { id: 2, task: 'Irrigation system check', date: 'Dec 15', priority: 'medium' },
    { id: 3, task: 'Harvest planning meeting', date: 'Dec 18', priority: 'high' },
    { id: 4, task: 'Equipment maintenance', date: 'Dec 20', priority: 'low' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's what's happening on your farm.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Farms</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFarms}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Community</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCommunity}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Chats</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.aiInteractions}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Market Growth</p>
                  <p className="text-2xl font-bold text-green-600">{stats.marketTrends}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {activity.type === 'chat' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'community' && <Users className="h-5 w-5 text-green-600" />}
                      {activity.type === 'market' && <TrendingUp className="h-5 w-5 text-purple-600" />}
                      {activity.type === 'weather' && <Calendar className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Tasks</h2>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-500 mt-1">{task.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
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