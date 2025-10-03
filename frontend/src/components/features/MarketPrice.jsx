import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, Filter, ArrowUpDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const MarketPrice = ({ crop }) => {
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [commodities, setCommodities] = useState([])
  const [marketPrices, setMarketPrices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    commodity: '',
    fromDate: '',
    toDate: '',
    sortOrder: 'desc'
  })

  const fetchData = async (url) => {
    console.log('Making API request to:', `http://localhost:8000/api/market${url}`)
    const response = await fetch(`http://localhost:8000/api/market${url}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('API response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)
      throw new Error(`API request failed: ${response.status}`)
    }
    return response.json()
  }



  const loadAllCommodities = async () => {
    try {
      const response = await fetch('/api/commodities')
      const data = await response.json()
      setCommodities(data.commodities || [])
    } catch (err) {
      console.error('Failed to load commodities:', err)
      setCommodities([])
    }
  }

  const loadMarketPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      
      // Use selected state and district (required)
      const state = filters.state || crop?.state || crop?.location?.state
      const district = filters.district || crop?.district || crop?.location?.district
      const commodity = filters.commodity
      
      if (!state || !district) {
        setError('Please select state and district first')
        return
      }
      
      params.append('state', state)
      params.append('district', district)
      if (commodity) params.append('commodity', commodity)
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      params.append('sort_order', filters.sortOrder)
      params.append('limit', '50')

      console.log('Fetching market prices with params:', params.toString())
      const data = await fetchData(`/market-prices?${params}`)
      console.log('Market prices response:', data)
      setMarketPrices(data.prices || [])
    } catch (err) {
      console.error('Market prices error:', err)
      setError('Failed to fetch market prices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllCommodities()
  }, [])

  const loadStates = async () => {
    try {
      const data = await fetchData('/api-states')
      setStates(data.states || [])
    } catch (err) {
      console.error('Failed to load states:', err)
    }
  }

  const loadDistricts = async () => {
    try {
      if (!filters.state) {
        setDistricts([])
        return
      }
      const data = await fetchData(`/api-districts/${encodeURIComponent(filters.state)}`)
      setDistricts(data.districts || [])
    } catch (err) {
      console.error('Failed to load districts:', err)
      setDistricts([])
    }
  }

  useEffect(() => {
    loadStates()
  }, [])

  useEffect(() => {
    loadDistricts()
    setFilters(prev => ({ ...prev, district: '', commodity: '' })) // Reset dependent fields
  }, [filters.state])

  useEffect(() => {
    if (filters.state && filters.district) {
      loadMarketPrices()
    }
  }, [filters.state, filters.district])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Market Price Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                disabled={!filters.state}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commodity
              </label>
              <select
                value={filters.commodity}
                onChange={(e) => handleFilterChange('commodity', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Commodity</option>
                {commodities.map(commodity => (
                  <option key={commodity} value={commodity}>{commodity}</option>
                ))}
              </select>
              {commodities.length > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  {commodities.length} commodities available
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    handleFilterChange('fromDate', today)
                    handleFilterChange('toDate', today)
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const past10Days = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)
                    handleFilterChange('fromDate', past10Days.toISOString().split('T')[0])
                    handleFilterChange('toDate', today.toISOString().split('T')[0])
                  }}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Past 10 Days
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="From"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by Price</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Market Prices Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Market Prices</h3>
            <button
              onClick={loadMarketPrices}
              disabled={loading || !filters.state || !filters.district}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading market prices...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Commodity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Market</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">State</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">District</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Variety</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Min Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Max Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center justify-end space-x-1">
                        <span>Modal Price</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Arrival Date</th>
                  </tr>
                </thead>
                <tbody>
                  {!filters.state || !filters.district ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-gray-500">
                        Please select state and district to view market prices
                      </td>
                    </tr>
                  ) : marketPrices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-gray-500">
                        No market prices found for {filters.commodity} in {crop?.state || crop?.location?.state || 'your area'}
                      </td>
                    </tr>
                  ) : (
                    marketPrices.map((price, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{price.commodity}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{price.market}</td>
                        <td className="py-3 px-4 text-gray-700">{price.state}</td>
                        <td className="py-3 px-4 text-gray-700">{price.district}</td>
                        <td className="py-3 px-4 text-gray-700">{price.variety || '-'}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">₹{price.min_price || '-'}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">₹{price.max_price || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">₹{price.price}</td>
                        <td className="py-3 px-4 text-gray-700">{price.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {marketPrices.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Highest Price</p>
                  <p className="text-2xl font-bold">₹{Math.max(...marketPrices.map(p => p.price))}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Average Price</p>
                  <p className="text-2xl font-bold">
                    ₹{Math.round(marketPrices.reduce((sum, p) => sum + p.price, 0) / marketPrices.length)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Lowest Price</p>
                  <p className="text-2xl font-bold">₹{Math.min(...marketPrices.map(p => p.price))}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketPrice