import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        alert('Registration successful!')
        navigate('/dashboard')
      } else {
        const error = await response.json()
        alert(error.detail || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/25 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-sage/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-meadow/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-accent-olive/8 rounded-full blur-2xl animate-pulse delay-1500"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/90 via-accent-sage/5 to-accent-meadow/10 backdrop-blur-xl border border-accent-sage/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-olive/5 via-transparent to-accent-meadow/5"></div>
          <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-accent-meadow/20 to-accent-olive/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-accent-sage/15 rounded-full blur-xl"></div>
          <div className="relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-accent-sage to-accent-olive rounded-2xl shadow-lg">
                <Sprout className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-accent-sage bg-clip-text text-transparent mb-2">Join Farmers Guild</h2>
            <p className="text-text-secondary/80">Create your account and start your farming journey</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-accent-sage" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-white/90 border border-accent-sage/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow/60 focus:border-accent-meadow/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/95"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
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
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 bg-white/90 border border-accent-sage/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow/60 focus:border-accent-meadow/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/95"
                    placeholder="Create a password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-accent-sage" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 bg-white/90 border border-accent-sage/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-meadow/60 focus:border-accent-meadow/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/95"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-accent-sage" />
                    ) : (
                      <Eye className="h-5 w-5 text-accent-sage" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-accent-meadow focus:ring-accent-meadow/60 border-accent-sage/40 rounded transition-colors duration-200"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-text-primary">
                I agree to the{' '}
                <Link to="/terms" className="text-accent-meadow hover:text-accent-sage transition-colors duration-200 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-accent-meadow hover:text-accent-sage transition-colors duration-200 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent-sage to-accent-olive hover:from-accent-sage/90 hover:to-accent-olive/90 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-accent-meadow hover:text-accent-sage transition-colors duration-200">
                  Sign in here
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

export default Register