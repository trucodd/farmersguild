import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CropDashboard from './pages/CropDashboard'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Marketplace from './pages/Marketplace'
import MarketPrice from './pages/MarketPrice'
import Labor from './pages/Labor'
import Profile from './pages/Profile'

function App() {
  try {
    return (
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crops" element={<CropDashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/market-price" element={<MarketPrice />} />
              <Route path="/labor" element={<Labor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    )
  } catch (error) {
    return (
      <div style={{padding: '20px', color: 'red'}}>
        <h1>Error loading app</h1>
        <p>{error.message}</p>
      </div>
    )
  }
}

export default App