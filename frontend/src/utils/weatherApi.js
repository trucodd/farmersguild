const API_BASE_URL = 'http://localhost:8000/api'

export const fetchWeatherData = async (zipcode) => {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_BASE_URL}/weather/weather/${zipcode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Weather API error:', error)
    throw error
  }
}

export const fetchForecastData = async (zipcode) => {
  const token = localStorage.getItem('token')
  
  try {
    const response = await fetch(`${API_BASE_URL}/weather/forecast/${zipcode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Forecast API error:', error)
    throw error
  }
}