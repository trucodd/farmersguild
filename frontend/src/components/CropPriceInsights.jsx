import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CropPriceInsights = ({ crop }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCropPrices = async (marketState = null, marketDistrict = null) => {
    if (!user?.id || !crop) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Create API call for single crop with optional market selection
      let url = `http://localhost:8000/api/market/crop-insights/${user.id}?crop=${crop.name}`;
      if (marketState && marketDistrict) {
        url += `&market_state=${marketState}&market_district=${marketDistrict}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        throw new Error('Failed to fetch price data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (crop && user) {
      fetchCropPrices();
    }
  }, [crop, user]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'rising': return 'text-green-600 bg-green-50';
      case 'falling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!crop) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-500">Select a crop to view market prices</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Market Prices - {crop.name}</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Market Prices - {crop.name}</h3>
          <button
            onClick={fetchCropPrices}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchCropPrices}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Market Prices - {crop.name}</h3>
        <button
          onClick={fetchCropPrices}
          className="p-1 text-gray-500 hover:text-gray-700"
          title="Refresh prices"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {insights ? (
        <div className="space-y-4">
          {/* Location & Market Selection */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              Current Market: {insights.location || 'Multiple markets'}
            </div>
            
            {insights.available_markets && insights.available_markets.length > 1 && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Switch to nearby mandi:</label>
                <select 
                  className="text-xs border rounded px-2 py-1 w-full"
                  onChange={(e) => {
                    const [state, district] = e.target.value.split('|');
                    // Refetch with new market
                    fetchCropPrices(state, district);
                  }}
                >
                  <option value="">Current market</option>
                  {insights.available_markets.map((market, idx) => (
                    <option key={idx} value={`${market.state}|${market.district}`}>
                      {market.district}, {market.state} ({market.distance_info || 'nearby'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {insights.summary && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-800">{insights.summary}</p>
            </div>
          )}

          {/* Price Details */}
          {insights.insights && Object.keys(insights.insights).length > 0 && (
            <div className="space-y-3">
              {Object.entries(insights.insights).map(([cropName, data]) => (
                <div key={cropName} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{cropName}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.trend)}
                      <span className={`px-2 py-1 rounded text-xs ${getTrendColor(data.trend)}`}>
                        {data.trend}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Current: </span>
                      <span className="font-medium">₹{data.latest_price?.toFixed(0) || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Change: </span>
                      <span className={`font-medium ${(data.price_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(data.price_change || 0) >= 0 ? '+' : ''}₹{(data.price_change || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">No price data available</p>
        </div>
      )}
    </div>
  );
};

export default CropPriceInsights;