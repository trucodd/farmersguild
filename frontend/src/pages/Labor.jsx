import { Users, Clock, Calendar, TrendingUp, Plus, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'

const Labor = () => {
  const upcomingFeatures = [
    {
      icon: UserPlus,
      title: 'Worker Management',
      description: 'Add and manage farm workers with contact details and roles',
      color: 'bg-accent-meadow'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Track working hours and calculate wages automatically',
      color: 'bg-accent-sage'
    },
    {
      icon: Calendar,
      title: 'Work Scheduling',
      description: 'Schedule tasks and assign workers to different activities',
      color: 'bg-accent-olive'
    },
    {
      icon: TrendingUp,
      title: 'Labor Analytics',
      description: 'Analyze labor costs and productivity metrics',
      color: 'bg-accent-meadow'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">LABOR MANAGEMENT</h1>
          <p className="text-text-secondary text-lg">Manage your farm workforce efficiently</p>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl p-8 mb-8 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl text-center"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-accent-meadow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-accent-meadow" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">COMING SOON</h2>
            <p className="text-text-secondary text-lg">Advanced labor management features are under development</p>
          </div>
        </motion.div>

        {/* Upcoming Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-text-primary mb-6">Upcoming Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-card p-6 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${feature.color}/20 rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h4>
                      <p className="text-text-secondary text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Placeholder Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg">
            <Plus className="h-5 w-5 inline mr-2" />
            Get Notified When Available
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Labor