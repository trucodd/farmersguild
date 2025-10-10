import { ShoppingCart, Store, TrendingUp, Users, Package, DollarSign, MapPin, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const Marketplace = () => {
  const marketplaceFeatures = [
    {
      icon: Store,
      title: 'Sell Your Produce',
      description: 'List your crops and connect directly with buyers',
      color: 'bg-accent-meadow'
    },
    {
      icon: ShoppingCart,
      title: 'Buy Farm Supplies',
      description: 'Purchase seeds, fertilizers, and equipment from verified sellers',
      color: 'bg-accent-sage'
    },
    {
      icon: Users,
      title: 'Farmer Network',
      description: 'Connect with other farmers in your region',
      color: 'bg-accent-olive'
    },
    {
      icon: TrendingUp,
      title: 'Price Analytics',
      description: 'Get real-time market prices and trends',
      color: 'bg-accent-meadow'
    },
    {
      icon: Package,
      title: 'Bulk Orders',
      description: 'Place or fulfill large quantity orders',
      color: 'bg-accent-sage'
    },
    {
      icon: Star,
      title: 'Quality Assurance',
      description: 'Verified sellers and quality-checked products',
      color: 'bg-accent-olive'
    }
  ]

  const mockStats = [
    { label: 'Active Sellers', value: '2,500+', icon: Store },
    { label: 'Products Listed', value: '15,000+', icon: Package },
    { label: 'Successful Trades', value: '50,000+', icon: TrendingUp },
    { label: 'Farmers Connected', value: '10,000+', icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">FARMERS MARKETPLACE</h1>
          <p className="text-text-secondary text-lg">Connect, trade, and grow together</p>
        </motion.div>

        {/* Coming Soon Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl p-8 mb-8 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-accent-meadow/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-accent-meadow" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">MARKETPLACE LAUNCHING SOON</h2>
            <p className="text-text-secondary text-lg mb-6 max-w-2xl mx-auto">
              We're building a comprehensive marketplace where farmers can buy, sell, and connect. 
              Join thousands of farmers already waiting for launch!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg">
                Join Waitlist
              </button>
              <button className="border border-white/20 text-text-primary px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {mockStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card p-6 rounded-xl border border-white/20 text-center"
              >
                <div className="w-12 h-12 bg-accent-meadow/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-6 w-6 text-accent-meadow" />
                </div>
                <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-text-primary mb-6">What's Coming</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-card p-6 rounded-xl border border-white/20 hover:bg-white/10 transition-all group"
                >
                  <div className={`w-12 h-12 ${feature.color}/20 rounded-lg flex items-center justify-center mb-4 group-hover:${feature.color}/30 transition-colors`}>
                    <Icon className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h4>
                  <p className="text-text-secondary text-sm">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 rounded-xl border border-white/20 text-center"
        >
          <h3 className="text-xl font-bold text-text-primary mb-4">Be the First to Know</h3>
          <p className="text-text-secondary mb-6">Get notified when the marketplace launches and receive exclusive early access</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 glass-card border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-meadow text-text-primary placeholder-text-secondary"
            />
            <button className="bg-accent-meadow hover:bg-accent-meadow/80 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Notify Me
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Marketplace