# API Service for Backend Integration

import { API_BASE_URL } from '../config';

/**
 * Chat API - Connect to backend chat service
 */
export const chatApi = {
  /**
   * Send a message and get AI response with risk assessment
   * @param {Object} data - Chat data
   * @param {string} data.message - User's message
   * @param {string} data.language - Language code (en/sw)
   * @param {string} data.sessionId - Session identifier
   * @returns {Promise<Object>} - { reply, risk_level, hotlines }
   */
  async sendMessage({ message, language, sessionId }) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        language,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat service unavailable');
    }

    return response.json();
  },
};

/**
 * Resources API - Fetch local resources
 */
export const resourcesApi = {
  /**
   * Get resources by location
   * @param {string} location - County/city name
   * @param {string} language - Language code (en/sw)
   * @returns {Promise<Object>} - { resources: [{ name, number, type, location, language }] }
   */
  async getByLocation(location, language = 'en') {
    const params = new URLSearchParams({
      location,
      language,
    });

    const response = await fetch(`${API_BASE_URL}/resources?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    return response.json();
  },
};

/**
 * Admin API - Admin authentication and data
 */
export const adminApi = {
  /**
   * Admin login
   * @param {string} password - Admin password
   * @returns {Promise<Object>} - { token }
   */
  async login(password) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return response.json();
  },

  /**
   * Get all conversations (requires auth token)
   * @param {string} token - Admin auth token
   * @returns {Promise<Object>} - { conversations: [...] }
   */
  async getConversations(token) {
    const response = await fetch(`${API_BASE_URL}/admin/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  },

  /**
   * Get dashboard statistics (requires auth token)
   * @param {string} token - Admin auth token
   * @returns {Promise<Object>} - { total, green, amber, red }
   */
  async getStats(token) {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return response.json();
  },
};

/**
 * Health check API
 */
export const healthApi = {
  async check() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
