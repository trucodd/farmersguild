const API_BASE_URL = '/api';

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
    const response = await fetch(`${API_BASE_URL}/crops/`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  createCrop: async (cropData) => {
    const response = await fetch(`${API_BASE_URL}/crops/`, {
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
  },

  // Disease detection endpoints
  analyzeDisease: async (imageBase64, cropId) => {
    const response = await fetch(`${API_BASE_URL}/disease/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ image_base64: imageBase64, crop_id: cropId })
    });
    return response;
  },

  chatAboutDisease: async (detectionId, message) => {
    const response = await fetch(`${API_BASE_URL}/disease/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ detection_id: detectionId, message })
    });
    return response;
  },

  getDiseaseHistory: async (cropId) => {
    const response = await fetch(`${API_BASE_URL}/disease/history/${cropId}`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  getDiseaseChatHistory: async (detectionId) => {
    const response = await fetch(`${API_BASE_URL}/disease/chat-history/${detectionId}`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  getCropChatHistory: async (cropId) => {
    const response = await fetch(`${API_BASE_URL}/crop-data/chat-history/${cropId}`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  getCropActivityLogs: async (cropId) => {
    const response = await fetch(`${API_BASE_URL}/crop-data/activity-logs/${cropId}`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  addActivityLog: async (cropId, activityData) => {
    const response = await fetch(`${API_BASE_URL}/crops/${cropId}/activity`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activityData)
    });
    return response;
  },

  getCropCosts: async (cropId) => {
    const response = await fetch(`${API_BASE_URL}/crop-data/costs/${cropId}`, {
      headers: getAuthHeaders()
    });
    return response;
  },

  deleteDiseaseDetection: async (detectionId) => {
    const response = await fetch(`${API_BASE_URL}/disease/detection/${detectionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response;
  }
};