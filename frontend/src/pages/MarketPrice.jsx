import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MarketPrice = () => {
  const { user } = useAuth();
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState({});
  const [selectedState, setSelectedState] = useState('');
  const [userCrops, setUserCrops] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState(false);
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
        return {
          type: 'range',
          label: 'Past 7 days'
        };
      case 'month':
        return {
          type: 'range',
          label: 'Past 30 days'
        };
      default:
        return {
          type: 'single',
          date: today.toLocaleDateString('en-GB'),
          label: today.toLocaleDateString('en-GB')
        };
    }
  };

  // Fetch states from database
  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch('http://localhost:8000/api/market/states');
      if (response.ok) {
        const data = await response.json();
        setStates(data.states || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch districts for selected state
  const fetchDistricts = async (state) => {
    try {
      const response = await fetch(`http://localhost:8000/api/market/districts/${state}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(prev => ({ ...prev, [state]: data.districts || [] }));
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  // Fetch user's crops
  const fetchUserCrops = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/crops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const crops = await response.json();
        setUserCrops(crops || []);
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
    }
  };

  // Fetch AI insights for selected crop and markets
  const fetchInsights = async () => {
    if (!selectedCrop || selectedMarkets.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Get insights from all selected markets
      const allInsights = [];
      for (const market of selectedMarkets) {
        const dateInfo = getDateInfo(selectedDate);
        let url = `http://localhost:8000/api/market/crop-insights/${user.id}?crop=${selectedCrop}&market_state=${market.state}&market_district=${market.district}`;
        
        if (dateInfo.type === 'single') {
          url += `&date=${dateInfo.date}`;
        } else {
          url += `&date_type=${selectedDate}`;
        }
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          allInsights.push({
            ...data,
            market: `${market.district}, ${market.state}`
          });
        }
      }

      setInsights(allInsights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
    if (user) {
      fetchUserCrops();
    }
  }, [user]);

  // Fetch districts when state is selected
  useEffect(() => {
    if (selectedState && !districts[selectedState]) {
      fetchDistricts(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedCrop && selectedMarkets.length > 0) {
      fetchInsights();
    }
  }, [selectedCrop, selectedMarkets]);

  // Add market to selection
  const addMarket = (state, district) => {
    const marketKey = `${state}-${district}`;
    if (!selectedMarkets.find(m => `${m.state}-${m.district}` === marketKey)) {
      setSelectedMarkets([...selectedMarkets, { state, district }]);
    }
  };

  // Remove market from selection
  const removeMarket = (index) => {
    setSelectedMarkets(selectedMarkets.filter((_, i) => i !== index));
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-meadow/10 via-accent-sage/10 to-accent-olive/10 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">MARKET PRICES & AI INSIGHTS</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Market Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Market Selection */}
            <div className="glass-card rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">SELECT MARKETS</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setSelectedState(newState);
                      if (newState && !districts[newState]) {
                        fetchDistricts(newState);
                      }
                    }}
                    disabled={loadingStates}
                    className="w-full p-3 glass-card border border-white/20 rounded-lg focus:ring-2 focus:ring-accent-meadow disabled:opacity-50 text-text-primary"
                  >
                    <option value="">{loadingStates ? 'Loading states...' : 'Select State'}</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">District</label>
                  <select
                    onChange={(e) => {
                      const district = e.target.value;
                      if (selectedState && district) {
                        addMarket(selectedState, district);
                        e.target.value = '';
                      }
                    }}
                    disabled={!selectedState}
                    className="w-full p-3 glass-card border border-white/20 rounded-lg focus:ring-2 focus:ring-accent-meadow disabled:opacity-50 text-text-primary"
                  >
                    <option value="">
                      {!selectedState ? 'Select State First' : 
                       !districts[selectedState] ? 'Loading districts...' : 
                       'Select District'}
                    </option>
                    {selectedState && districts[selectedState] && districts[selectedState].map(district => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Markets */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Selected Markets:</h4>
                {selectedMarkets.length === 0 ? (
                  <p className="text-sm text-text-secondary">No markets selected</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMarkets.map((market, index) => (
                      <div key={index} className="flex items-center justify-between glass-card border border-white/10 p-3 rounded-lg">
                        <span className="text-sm text-text-primary">{market.district}, {market.state}</span>
                        <button
                          onClick={() => removeMarket(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Crop Selection */}
            <div className="glass-card rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">SELECT YOUR CROP</h3>
              
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-3 glass-card border border-white/20 rounded-lg focus:ring-2 focus:ring-accent-meadow text-text-primary"
              >
                <option value="">Select Crop</option>
                {userCrops.map(crop => (
                  <option key={crop.id} value={crop.name}>{crop.name}</option>
                ))}
              </select>
              
              {userCrops.length === 0 && (
                <p className="text-sm text-text-secondary mt-2">
                  No crops found. Add crops in "My Crops" section first.
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="glass-card rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">SELECT DATE</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'week', label: '1 Week Ago' },
                  { key: 'month', label: '1 Month Ago' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      selectedDate === key
                        ? 'bg-accent-meadow text-white border-accent-meadow'
                        : 'glass-card text-text-primary border-white/20 hover:bg-white/10'
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
          </div>

          {/* Right Panel - AI Insights */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">AI MARKET INSIGHTS</h3>
                <button
                  onClick={fetchInsights}
                  disabled={loading || !selectedCrop || selectedMarkets.length === 0}
                  className="flex items-center space-x-2 px-4 py-3 bg-accent-meadow text-white rounded-lg hover:bg-accent-meadow/80 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Get Insights</span>
                </button>
              </div>

              {!selectedCrop || selectedMarkets.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">Select markets and crop to get AI insights</p>
                  <p className="text-text-secondary text-sm opacity-75">
                    Choose one or more markets and select a crop from your profile
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-accent-meadow mx-auto mb-4" />
                  <p className="text-text-secondary">Analyzing market data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={fetchInsights}
                    className="px-4 py-3 bg-accent-meadow text-white rounded-lg hover:bg-accent-meadow/80 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : insights && insights.length > 0 ? (
                <div className="space-y-6">
                  {insights.map((insight, index) => (
                    <div key={index} className="glass-card border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg text-text-primary">{selectedCrop} - {insight.market}</h4>
                      </div>

                      {/* AI Summary */}
                      <div className="glass-card border border-white/10 rounded-lg p-4 mb-4">
                        <p className="text-text-primary">{insight.summary?.replace(/<｜begin▁of▁sentence｜>/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '').replace(/`(.*?)`/g, '$1').replace(/\n\n+/g, '\n')}</p>
                      </div>

                      {/* Price Details */}
                      {insight.insights && Object.keys(insight.insights).length > 0 && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {Object.entries(insight.insights).map(([crop, data]) => (
                            <div key={crop} className="glass-card border border-white/10 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-text-primary">{crop}</span>
                                <div className="flex items-center space-x-2">
                                  {getTrendIcon(data.trend)}
                                  <span className="text-sm text-text-secondary">{data.trend}</span>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Current:</span>
                                  <span className="font-semibold text-text-primary">₹{data.latest_price?.toFixed(0) || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Change:</span>
                                  <span className={`font-semibold ${(data.price_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {(data.price_change || 0) >= 0 ? '+' : ''}₹{(data.price_change || 0).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No market data available for {selectedCrop}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPrice;