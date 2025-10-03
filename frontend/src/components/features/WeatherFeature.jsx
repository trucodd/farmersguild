import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react'

const WeatherFeature = ({ crop }) => {
  const currentWeather = {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    rainfall: 0,
    icon: Cloud
  }

  const forecast = [
    { day: 'Today', high: 32, low: 22, condition: 'Sunny', icon: Sun, rain: 0 },
    { day: 'Tomorrow', high: 30, low: 24, condition: 'Cloudy', icon: Cloud, rain: 10 },
    { day: 'Wed', high: 28, low: 20, condition: 'Rain', icon: CloudRain, rain: 80 },
    { day: 'Thu', high: 26, low: 18, condition: 'Rain', icon: CloudRain, rain: 90 },
    { day: 'Fri', high: 29, low: 21, condition: 'Partly Cloudy', icon: Cloud, rain: 20 },
    { day: 'Sat', high: 31, low: 23, condition: 'Sunny', icon: Sun, rain: 0 },
    { day: 'Sun', high: 33, low: 25, condition: 'Sunny', icon: Sun, rain: 5 }
  ]

  const recommendations = [
    {
      type: 'irrigation',
      message: 'Rain expected in 2 days. Consider reducing irrigation.',
      priority: 'medium'
    },
    {
      type: 'fertilizer',
      message: 'Good weather for fertilizer application today.',
      priority: 'high'
    },
    {
      type: 'pest',
      message: 'High humidity may increase pest activity. Monitor closely.',
      priority: 'medium'
    }
  ]

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Current Weather */}
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Current Weather</h2>
              <p className="text-sky-100 mb-4">{crop.location}</p>
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
        </div>

        {/* 7-Day Forecast */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
          <div className="grid grid-cols-7 gap-4">
            {forecast.map((day, index) => {
              const Icon = day.icon
              return (
                <div key={index} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-600 mb-2">{day.day}</p>
                  <Icon className="h-8 w-8 mx-auto mb-2 text-sky-600" />
                  <p className="text-xs text-gray-500 mb-2">{day.condition}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{day.high}°</p>
                    <p className="text-xs text-gray-500">{day.low}°</p>
                    <p className="text-xs text-blue-600">{day.rain}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weather Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Weather Recommendations for {crop.name}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-400'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-green-50 border-green-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-400'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                  }`}></div>
                  <p className="text-gray-800">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Impact on Crop */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Optimal Conditions for {crop.name}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Temperature</span>
                <span className="font-medium">20-30°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Humidity</span>
                <span className="font-medium">60-70%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rainfall</span>
                <span className="font-medium">500-700mm</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Current Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Temperature</span>
                <span className="text-green-600 font-medium">✓ Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Humidity</span>
                <span className="text-green-600 font-medium">✓ Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rainfall</span>
                <span className="text-yellow-600 font-medium">⚠ Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherFeature