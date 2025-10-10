import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertTriangle, Shield, Eye, MapPin, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchWeatherData, fetchForecastData } from '../../utils/weatherApi'

const WeatherFeature = ({ selectedCrop }) => {
  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real weather data
  useEffect(() => {
    const loadWeatherData = async () => {
      if (!selectedCrop.zipcode) {
        // Fallback to mock data if no zipcode
        setIsLoading(true)
        setTimeout(() => {
        const mockCurrentWeather = {
          temperature: 28,
          condition: 'Partly Cloudy',
          humidity: 75,
          windSpeed: 18,
          rainfall: 0,
          pressure: 1013,
          uvIndex: 7,
          icon: Cloud,
          location: selectedCrop.location
        }

        const mockForecast = [
          { day: 'Today', high: 32, low: 22, condition: 'Sunny', icon: Sun, rain: 0, humidity: 65 },
          { day: 'Tomorrow', high: 30, low: 24, condition: 'Cloudy', icon: Cloud, rain: 10, humidity: 70 },
          { day: 'Wed', high: 28, low: 20, condition: 'Heavy Rain', icon: CloudRain, rain: 85, humidity: 90 },
          { day: 'Thu', high: 26, low: 18, condition: 'Rain', icon: CloudRain, rain: 70, humidity: 85 },
          { day: 'Fri', high: 29, low: 21, condition: 'Partly Cloudy', icon: Cloud, rain: 20, humidity: 68 },
          { day: 'Sat', high: 35, low: 25, condition: 'Very Hot', icon: Sun, rain: 0, humidity: 45 },
          { day: 'Sun', high: 33, low: 25, condition: 'Sunny', icon: Sun, rain: 5, humidity: 50 }
        ]

        // Generate weather alerts based on forecast
        const alerts = []
        
        // Check for heavy rain risk
        if (mockForecast.some(day => day.rain > 80)) {
          alerts.push({
            id: 1,
            type: 'danger',
            title: 'Heavy Rain Alert',
            message: `Heavy rainfall expected Wednesday (85mm). Risk of waterlogging and fungal diseases in ${selectedCrop.name}.`,
            action: 'Ensure proper drainage and avoid irrigation for 2-3 days.',
            icon: CloudRain,
            severity: 'high'
          })
        }

        // Check for extreme heat
        if (mockForecast.some(day => day.high > 34)) {
          alerts.push({
            id: 2,
            type: 'warning',
            title: 'Heat Stress Warning',
            message: `Extreme heat expected Saturday (35°C). ${selectedCrop.name} may experience heat stress.`,
            action: 'Increase irrigation frequency and provide shade if possible.',
            icon: Sun,
            severity: 'medium'
          })
        }

        // Check for high humidity + rain (disease risk)
        if (mockForecast.some(day => day.humidity > 85 && day.rain > 60)) {
          alerts.push({
            id: 3,
            type: 'warning',
            title: 'Disease Risk Alert',
            message: `High humidity (90%) + rain creates ideal conditions for crop diseases.`,
            action: 'Monitor for early signs of fungal infections. Consider preventive fungicide application.',
            icon: Shield,
            severity: 'medium'
          })
        }

          setCurrentWeather(mockCurrentWeather)
          setForecast(mockForecast)
          setWeatherAlerts(alerts)
          setIsLoading(false)
        }, 2000)
        return
      }

      setIsLoading(true)
      try {
        const [weatherData, forecastData] = await Promise.all([
          fetchWeatherData(selectedCrop.zipcode),
          fetchForecastData(selectedCrop.zipcode)
        ])

        // Transform API data to component format
        const currentWeather = {
          temperature: Math.round(weatherData.main.temp),
          condition: weatherData.weather[0].description,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6), // m/s to km/h
          rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
          pressure: weatherData.main.pressure,
          uvIndex: 7, // Not available in free API
          icon: getWeatherIcon(weatherData.weather[0].main),
          location: weatherData.name
        }

        // Transform forecast data (5-day forecast with 3-hour intervals)
        const dailyForecast = []
        const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        for (let i = 0; i < 7 && i < forecastData.list.length; i += 8) {
          const dayData = forecastData.list[i]
          if (dayData) {
            dailyForecast.push({
              day: days[Math.floor(i/8)] || new Date(dayData.dt * 1000).toLocaleDateString('en', {weekday: 'short'}),
              high: Math.round(dayData.main.temp_max),
              low: Math.round(dayData.main.temp_min),
              condition: dayData.weather[0].description,
              icon: getWeatherIcon(dayData.weather[0].main),
              rain: dayData.pop * 100, // probability of precipitation
              humidity: dayData.main.humidity
            })
          }
        }

        // Generate alerts based on real data
        const alerts = generateWeatherAlerts(currentWeather, dailyForecast, selectedCrop.name)

        setCurrentWeather(currentWeather)
        setForecast(dailyForecast)
        setWeatherAlerts(alerts)
      } catch (error) {
        console.error('Failed to fetch weather data:', error)
        // Fallback to mock data on error
        const mockCurrentWeather = {
          temperature: 28,
          condition: 'Partly Cloudy',
          humidity: 75,
          windSpeed: 18,
          rainfall: 0,
          pressure: 1013,
          uvIndex: 7,
          icon: Cloud,
          location: selectedCrop.location || 'Unknown'
        }
        setCurrentWeather(mockCurrentWeather)
        setForecast([])
        setWeatherAlerts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadWeatherData()
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedCrop])

  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return Sun
      case 'rain':
      case 'drizzle':
        return CloudRain
      case 'clouds':
        return Cloud
      default:
        return Cloud
    }
  }

  const generateWeatherAlerts = (current, forecast, cropName) => {
    const alerts = []
    
    // Check for heavy rain risk
    if (forecast.some(day => day.rain > 80)) {
      alerts.push({
        id: 1,
        type: 'danger',
        title: 'Heavy Rain Alert',
        message: `Heavy rainfall expected. Risk of waterlogging and fungal diseases in ${cropName}.`,
        action: 'Ensure proper drainage and avoid irrigation for 2-3 days.',
        icon: CloudRain,
        severity: 'high'
      })
    }

    // Check for extreme heat
    if (forecast.some(day => day.high > 34)) {
      alerts.push({
        id: 2,
        type: 'warning',
        title: 'Heat Stress Warning',
        message: `Extreme heat expected. ${cropName} may experience heat stress.`,
        action: 'Increase irrigation frequency and provide shade if possible.',
        icon: Sun,
        severity: 'medium'
      })
    }

    // Check for high humidity + rain (disease risk)
    if (forecast.some(day => day.humidity > 85 && day.rain > 60)) {
      alerts.push({
        id: 3,
        type: 'warning',
        title: 'Disease Risk Alert',
        message: `High humidity + rain creates ideal conditions for crop diseases.`,
        action: 'Monitor for early signs of fungal infections. Consider preventive fungicide application.',
        icon: Shield,
        severity: 'medium'
      })
    }

    return alerts
  }

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 text-red-800'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800'
      default: return 'border-blue-500 bg-blue-50 text-blue-800'
    }
  }

  const getAlertIcon = (severity) => {
    return severity === 'high' ? 'text-red-600' : severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center glass-card p-8 rounded-xl border border-white/20"
        >
          <div className="animate-spin w-12 h-12 border-4 border-accent-meadow border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Loading Weather Data</h3>
          <p className="text-text-secondary">Fetching forecast for {selectedCrop.location} {selectedCrop.zipcode && `(${selectedCrop.zipcode})`}...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">WEATHER FORECAST</h1>
          <p className="text-text-secondary text-lg">Weather insights for {selectedCrop.name}</p>
        </motion.div>
        {/* Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span>Crop Risk Alerts</span>
            </h3>
            {weatherAlerts.map((alert, index) => {
              const AlertIcon = alert.icon
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`glass-card border-l-4 rounded-xl p-6 ${
                    alert.severity === 'high' ? 'border-l-red-500 bg-red-50/50' :
                    alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50/50' :
                    'border-l-blue-500 bg-blue-50/50'
                  } border border-white/20`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      alert.severity === 'high' ? 'bg-red-100' :
                      alert.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertIcon className={`h-6 w-6 ${
                        alert.severity === 'high' ? 'text-red-600' :
                        alert.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-text-primary mb-2">{alert.title}</h4>
                      <p className="text-text-secondary mb-3">{alert.message}</p>
                      <div className="glass-card p-3 rounded-lg border border-white/10">
                        <p className="text-sm text-text-primary"><strong>Action Required:</strong> {alert.action}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Current Weather */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-accent-meadow/20 via-accent-sage/15 to-accent-olive/20 backdrop-blur-md border border-white/30 shadow-xl"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-meadow/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">CURRENT WEATHER</h2>
                <div className="flex items-center space-x-2 text-text-secondary">
                  <MapPin className="h-4 w-4" />
                  <span>{currentWeather.location} {selectedCrop.zipcode && `(${selectedCrop.zipcode})`}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-accent-meadow mb-1">{currentWeather.temperature}°C</div>
                <p className="text-text-secondary capitalize">{currentWeather.condition}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-lg border border-white/10 text-center">
                <Droplets className="h-6 w-6 text-accent-meadow mx-auto mb-2" />
                <p className="text-sm text-text-secondary mb-1">Humidity</p>
                <p className="font-bold text-text-primary">{currentWeather.humidity}%</p>
              </div>
              <div className="glass-card p-4 rounded-lg border border-white/10 text-center">
                <Wind className="h-6 w-6 text-accent-meadow mx-auto mb-2" />
                <p className="text-sm text-text-secondary mb-1">Wind Speed</p>
                <p className="font-bold text-text-primary">{currentWeather.windSpeed} km/h</p>
              </div>
              <div className="glass-card p-4 rounded-lg border border-white/10 text-center">
                <Thermometer className="h-6 w-6 text-accent-meadow mx-auto mb-2" />
                <p className="text-sm text-text-secondary mb-1">Pressure</p>
                <p className="font-bold text-text-primary">{currentWeather.pressure} hPa</p>
              </div>
              <div className="glass-card p-4 rounded-lg border border-white/10 text-center">
                <Eye className="h-6 w-6 text-accent-meadow mx-auto mb-2" />
                <p className="text-sm text-text-secondary mb-1">UV Index</p>
                <p className="font-bold text-text-primary">{currentWeather.uvIndex}</p>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-text-secondary flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl border border-white/20 p-6"
        >
          <h3 className="text-xl font-bold text-text-primary mb-6">7-DAY FORECAST</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {forecast.map((day, index) => {
              const Icon = day.icon
              const isRisky = day.rain > 70 || day.high > 34 || day.humidity > 85
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`text-center p-4 rounded-lg transition-all hover:scale-105 ${
                    isRisky ? 'bg-red-50/50 border border-red-200' : 'glass-card border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary mb-3">{day.day}</p>
                  <Icon className={`h-10 w-10 mx-auto mb-3 ${
                    isRisky ? 'text-red-500' : 'text-accent-meadow'
                  }`} />
                  <p className="text-xs text-text-secondary mb-3 capitalize">{day.condition}</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-text-primary">{day.high}°</p>
                    <p className="text-sm text-text-secondary">{day.low}°</p>
                    <div className="flex items-center justify-center space-x-1">
                      <Droplets className="h-3 w-3 text-blue-500" />
                      <p className={`text-xs font-medium ${
                        day.rain > 50 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {day.rain}%
                      </p>
                    </div>
                  </div>
                  {isRisky && (
                    <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-2" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Crop-Specific Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl border border-white/20 p-6"
        >
          <h3 className="text-xl font-bold text-text-primary mb-6">
            WEATHER IMPACT ON {selectedCrop.name.toUpperCase()}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Eye className="h-5 w-5 text-accent-meadow" />
                <span>Current Conditions</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/10">
                  <span className="text-text-secondary">Temperature</span>
                  <span className={`font-semibold flex items-center space-x-1 ${
                    currentWeather.temperature > 30 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    <span>{currentWeather.temperature > 30 ? '⚠' : '✓'}</span>
                    <span>{currentWeather.temperature > 30 ? 'High' : 'Good'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/10">
                  <span className="text-text-secondary">Humidity</span>
                  <span className={`font-semibold flex items-center space-x-1 ${
                    currentWeather.humidity > 80 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    <span>{currentWeather.humidity > 80 ? '⚠' : '✓'}</span>
                    <span>{currentWeather.humidity > 80 ? 'High' : 'Normal'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/10">
                  <span className="text-text-secondary">Wind Speed</span>
                  <span className={`font-semibold flex items-center space-x-1 ${
                    currentWeather.windSpeed > 20 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    <span>{currentWeather.windSpeed > 20 ? '⚠' : '✓'}</span>
                    <span>{currentWeather.windSpeed > 20 ? 'Strong' : 'Calm'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-accent-meadow" />
                <span>Immediate Actions</span>
              </h4>
              <div className="space-y-3">
                {currentWeather.humidity > 80 && (
                  <div className="glass-card p-3 rounded-lg border border-yellow-200 bg-yellow-50/50">
                    <p className="text-sm text-text-primary"><strong>High Humidity:</strong> Monitor for fungal diseases</p>
                  </div>
                )}
                {currentWeather.temperature > 30 && (
                  <div className="glass-card p-3 rounded-lg border border-red-200 bg-red-50/50">
                    <p className="text-sm text-text-primary"><strong>Heat Stress:</strong> Increase irrigation frequency</p>
                  </div>
                )}
                {currentWeather.windSpeed > 20 && (
                  <div className="glass-card p-3 rounded-lg border border-blue-200 bg-blue-50/50">
                    <p className="text-sm text-text-primary"><strong>Strong Winds:</strong> Check plant support structures</p>
                  </div>
                )}
                {currentWeather.humidity <= 80 && currentWeather.temperature <= 30 && currentWeather.windSpeed <= 20 && (
                  <div className="glass-card p-3 rounded-lg border border-green-200 bg-green-50/50">
                    <p className="text-sm text-text-primary"><strong>Good Conditions:</strong> Ideal for normal farming activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WeatherFeature