import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sprout, Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gradient-to-r from-accent-meadow/40 via-accent-sage/35 to-accent-olive/40 backdrop-blur-lg border-b border-white/40 sticky top-0 z-50 shadow-xl bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <Sprout className="h-8 w-8 sm:h-10 sm:w-10 text-accent-meadow" />
              <span className="text-lg sm:text-2xl font-bold text-text-primary tracking-wide">FARMERS GUILD</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-10">
            <Link to="/" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
              Home
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                  Dashboard
                </Link>
                <Link to="/crops" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                  Features
                </Link>
                <Link to="/chat" className="text-text-primary hover:text-accent-olive transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                  AI Assistant
                </Link>
                <Link to="/market-price" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                  Market
                </Link>
                <Link to="/labor" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                  Labor
                </Link>
              </>
            )}
            
            {user ? (
              <div className="flex items-center space-x-6">
                <Link to="/profile" className="flex items-center space-x-2 text-text-primary hover:text-accent-meadow transition-all duration-200">
                  <User className="h-5 w-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-white border border-accent-sage text-accent-sage hover:bg-accent-sage hover:text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium uppercase tracking-wider"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link
                  to="/login"
                  className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-accent-meadow hover:bg-accent-meadow/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm uppercase tracking-wider"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-primary hover:text-accent-meadow transition-all duration-200"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/40 bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                Home
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                    Dashboard
                  </Link>
                  <Link to="/crops" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                    Features
                  </Link>
                  <Link to="/chat" className="text-text-primary hover:text-accent-olive transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                    AI Assistant
                  </Link>
                  <Link to="/market-price" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                    Market
                  </Link>
                  <Link to="/labor" className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider">
                    Labor
                  </Link>
                </>
              )}
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="bg-white border border-accent-sage text-accent-sage hover:bg-accent-sage hover:text-white px-4 py-2 rounded-lg transition-all duration-200 w-fit text-sm font-medium uppercase tracking-wider"
                >
                  Logout
                </button>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/login"
                    className="text-text-primary hover:text-accent-meadow transition-all duration-200 font-semibold text-sm uppercase tracking-wider"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-accent-meadow hover:bg-accent-meadow/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 w-fit text-sm uppercase tracking-wider"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar