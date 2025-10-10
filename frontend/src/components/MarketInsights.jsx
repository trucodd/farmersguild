import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MarketInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [userCrops, setUserCrops] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDate, setSelectedDate] = useState('today');

  const getDateInfo = (dateType) => {
    const today = new Date();
    
    switch(dateType) {
      case 'today':
        return {
          type: 'single',
          date: today.toLocaleDateString('en-GB'),
          label: today.toLocaleDateString('en-GB')
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          type: 'single',
          date: yesterday.toLocaleDateString('en-GB'),
          label: yesterday.toLocaleDateString('en-GB')
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          type: 'range',
          startDate: weekStart.toLocaleDateString('en-GB'),
          endDate: today.toLocaleDateString('en-GB'),
          label: `Past 7 days`
        };
      case 'month':
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          type: 'range',
          startDate: monthStart.toLocaleDateString('en-GB'),
          endDate: today.toLocaleDateString('en-GB'),
          label: `Past 30 days`
        };
      default:
        return {
          type: 'single',
          date: today.toLocaleDateString('en-GB'),
          label: today.toLocaleDateString('en-GB')
        };
    }
  };

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/market/states-districts-db');
      if (response.ok) {
        const data = await response.json();
        setStates(data.states || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistricts = async (state) => {
    try {
      const response = await fetch('/api/market/states-districts-db');
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.states_districts[state] || []);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const fetchUserCrops = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/market/user-commodities/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCrops(data.commodities || []);
      }
    } catch (err) {
      console.error('Error fetching user crops:', err);
    }
  };

  const fetchInsights = async () => {
    if (!user?.id || !selectedState || !selectedDistrict || !selectedCrop) {
      setError('Please select state, district, and crop');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const dateInfo = getDateInfo(selectedDate);
      let url = `/api/market/crop-insights/${user.id}?crop=${selectedCrop}&market_state=${selectedState}&market_district=${selectedDistrict}`;
      
      if (dateInfo.type === 'single') {
        url += `&date=${dateInfo.date}`;
      } else {
        url += `&date_type=${selectedDate}&start_date=${dateInfo.startDate}&end_date=${dateInfo.endDate}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStates();
      fetchUserCrops();
    }
  }, [user]);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
      setSelectedDistrict('');
    }
  }, [selectedState]);

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

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Insights</h3>
          <p className="text-gray-500 text-sm">
            Please log in to view market insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Insights</h3>
      
      {/* Selection Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select 
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          >
            <option value="">Select District</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Crop</label>
          <select 
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Crop</option>
            {userCrops.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Date Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week', label: '1 Week Ago' },
            { key: 'month', label: '1 Month Ago' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`px-3 py-2 text-sm rounded-md border ${
                selectedDate === key
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
              <div className="text-xs opacity-75">
                {getDateInfo(key).label}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={fetchInsights}
        disabled={!selectedState || !selectedDistrict || !selectedCrop || loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Search className="w-4 h-4" />
        )}
        {loading ? 'Getting Insights...' : 'Get Market Insights'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Try selecting a different district or check if the crop is available in the selected market.
          </p>
        </div>
      )}
      
      {/* Insights Display */}
      {insights && (
        <div className="mt-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-600">
                📍 {selectedDistrict}, {selectedState} • {selectedCrop}
              </p>
              {insights.total_historical_records && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {insights.total_historical_records} records • {insights.data_quality} data
                </span>
              )}
            </div>
            <div className="text-gray-800 whitespace-pre-line">
              {(insights.summary || 'No market summary available').replace(/<｜begin▁of▁sentence｜>/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '').replace(/`(.*?)`/g, '$1').replace(/\n\n+/g, '\n')}
            </div>
            {insights.analysis_period && (
              <p className="text-xs text-gray-500 mt-2">
                📅 Analysis period: {insights.analysis_period.replace('_', ' ')}
              </p>
            )}
          </div>

          {insights.insights && Object.keys(insights.insights).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Price Details</h4>
              {Object.entries(insights.insights).map(([crop, data]) => (
                <div key={crop} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{crop}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(data.trend)}
                      <span className={`px-2 py-1 rounded text-xs ${getTrendColor(data.trend)}`}>
                        {data.trend}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current: </span>
                      <span className="font-medium">₹{Math.round(data.latest_price || 0)}</span>
                      <span className="text-xs text-gray-500 ml-1">(₹{((data.latest_price || 0) / 100).toFixed(1)}/kg)</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Change: </span>
                      <span className={`font-medium ${(data.price_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(data.price_change || 0) >= 0 ? '+' : ''}₹{Math.round(data.price_change || 0)}
                        {data.price_change && Math.abs(data.price_change) > 0 && (
                          <span className="text-xs ml-1">
                            ({((data.price_change / (data.latest_price - data.price_change)) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average: </span>
                      <span>₹{Math.round(data.avg_price || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Range: </span>
                      <span>₹{Math.round(data.min_price || 0)}-₹{Math.round(data.max_price || 0)}</span>
                    </div>
                    {data.historical_data_available && (
                      <div className="col-span-2 text-xs text-gray-500 mt-1">
                        📊 Based on {data.historical_data_available} records • {data.market_confidence} confidence
                      </div>
                    )}
                  </div>
                  {data.price_volatility && (
                    <div className="mt-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        data.price_volatility === 'high' ? 'bg-red-100 text-red-700' :
                        data.price_volatility === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {data.price_volatility} volatility
                      </span>
                      {data.practical_advice && (
                        <span className="ml-2 text-gray-600">• {data.practical_advice}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketInsights;