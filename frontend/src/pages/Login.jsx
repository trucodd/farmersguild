import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sprout, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/25 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent-meadow/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-sage/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-olive/5 rounded-full blur-2xl"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/90 via-accent-sage/5 to-accent-meadow/10 backdrop-blur-xl border border-accent-sage/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-meadow/5 via-transparent to-accent-olive/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-sage/20 to-accent-meadow/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-olive/15 rounded-full blur-xl"></div>
          <div className="relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-accent-meadow to-accent-sage rounded-2xl shadow-lg">
                <Sprout className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-accent-olive bg-clip-text text-transparent mb-2">Welcome Back</h2>
            <p className="text-text-secondary/80">Sign in to your Farmers Guild account</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-accent-sage" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white/90 border border-accent-sage/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow/60 focus:border-accent-meadow/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/95"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-accent-sage" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-white/90 border border-accent-sage/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow/60 focus:border-accent-meadow/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/95"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-accent-sage" />
                    ) : (
                      <Eye className="h-5 w-5 text-accent-sage" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent-meadow focus:ring-accent-meadow/60 border-accent-sage/40 rounded transition-colors duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-accent-meadow hover:text-accent-sage transition-colors duration-200 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent-meadow to-accent-sage hover:from-accent-meadow/90 hover:to-accent-sage/90 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-accent-meadow hover:text-accent-sage transition-colors duration-200">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login