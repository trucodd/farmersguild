// Fetch commodities from database API
export const fetchCommodities = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/commodities')
    const data = await response.json()
    return data.commodities || []
  } catch (error) {
    console.error('Error fetching commodities:', error)
    return []
  }
}