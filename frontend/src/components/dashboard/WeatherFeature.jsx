import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertTriangle, Shield, Eye } from 'lucide-react'
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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data for {selectedCrop.location} {selectedCrop.zipcode && `(${selectedCrop.zipcode})`}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6">
      {/* Weather Alerts - Top Priority */}
      {weatherAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Crop Risk Alerts</span>
          </h3>
          {weatherAlerts.map((alert) => {
            const AlertIcon = alert.icon
            return (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <AlertIcon className={`h-6 w-6 mt-1 ${getAlertIcon(alert.severity)}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{alert.title}</h4>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="bg-white/50 rounded p-2 text-sm">
                      <strong>Action Required:</strong> {alert.action}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Current Weather */}
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Weather</h2>
            <p className="text-sky-100 mb-4">{currentWeather.location} {selectedCrop.zipcode && `(${selectedCrop.zipcode})`}</p>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">{currentWeather.temperature}°C</div>
              <div>
                <currentWeather.icon className="h-12 w-12 mb-2" />
                <p className="text-sky-100">{currentWeather.condition}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/20 rounded-lg p-3">
              <Droplets className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Humidity</p>
              <p className="font-semibold">{currentWeather.humidity}%</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <Wind className="h-6 w-6 mx-auto mb-1" />
              <p className="text-sm">Wind</p>
              <p className="font-semibold">{currentWeather.windSpeed} km/h</p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-sky-200">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
        <div className="grid grid-cols-7 gap-4">
          {forecast.map((day, index) => {
            const Icon = day.icon
            const isRisky = day.rain > 70 || day.high > 34 || day.humidity > 85
            return (
              <div 
                key={index} 
                className={`text-center p-3 rounded-lg transition-colors ${
                  isRisky ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-600 mb-2">{day.day}</p>
                <Icon className={`h-8 w-8 mx-auto mb-2 ${
                  isRisky ? 'text-red-600' : 'text-sky-600'
                }`} />
                <p className="text-xs text-gray-500 mb-2">{day.condition}</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{day.high}°</p>
                  <p className="text-xs text-gray-500">{day.low}°</p>
                  <p className={`text-xs ${day.rain > 50 ? 'text-red-600 font-semibold' : 'text-blue-600'}`}>
                    {day.rain}%
                  </p>
                </div>
                {isRisky && (
                  <AlertTriangle className="h-3 w-3 text-red-600 mx-auto mt-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Crop-Specific Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Weather Impact on {selectedCrop.name}
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Current Conditions</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Temperature</span>
                <span className={`font-medium ${
                  currentWeather.temperature > 30 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {currentWeather.temperature > 30 ? '⚠ High' : '✓ Good'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Humidity</span>
                <span className={`font-medium ${
                  currentWeather.humidity > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {currentWeather.humidity > 80 ? '⚠ High' : '✓ Normal'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Wind Speed</span>
                <span className={`font-medium ${
                  currentWeather.windSpeed > 20 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {currentWeather.windSpeed > 20 ? '⚠ Strong' : '✓ Calm'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions</h4>
            <div className="space-y-2">
              {currentWeather.humidity > 80 && (
                <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                  <strong>High Humidity:</strong> Monitor for fungal diseases
                </div>
              )}
              {currentWeather.temperature > 30 && (
                <div className="text-sm bg-red-50 border border-red-200 rounded p-2">
                  <strong>Heat Stress:</strong> Increase irrigation frequency
                </div>
              )}
              {currentWeather.windSpeed > 20 && (
                <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2">
                  <strong>Strong Winds:</strong> Check plant support structures
                </div>
              )}
              {currentWeather.humidity <= 80 && currentWeather.temperature <= 30 && currentWeather.windSpeed <= 20 && (
                <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
                  <strong>Good Conditions:</strong> Ideal for normal farming activities
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherFeature