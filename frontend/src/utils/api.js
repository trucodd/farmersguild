const API_BASE_URL = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  // Auth endpoints
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response;
  },

  // Crop endpoints
  getCrops: async () => {
    const response = await fetch(`${API_BASE_URL}/crops`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  createCrop: async (cropData) => {
    const response = await fetch(`${API_BASE_URL}/crops`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cropData)
    });
    return response;
  },

  deleteCrop: async (cropId) => {
    const response = await fetch(`${API_BASE_URL}/crops/${cropId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response;
  },

  // Market endpoints
  getMarketInsights: async (userId, marketState = null, marketDistrict = null) => {
    let url = `${API_BASE_URL}/market/insights/${userId}`;
    if (marketState && marketDistrict) {
      url += `?market_state=${marketState}&market_district=${marketDistrict}`;
    }
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return response;
  },

  // Crop AI endpoints
  chatWithCrop: async (cropId, message) => {
    const response = await fetch(`${API_BASE_URL}/crops/${cropId}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    });
    return response;
  }
};