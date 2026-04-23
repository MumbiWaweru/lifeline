// API Service for Backend Integration

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
      const error = await response.json().catch(() => ({ detail: 'Chat service unavailable' }));
      throw new Error(error.detail || 'Chat service unavailable');
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

  /**
   * Get all resources (no filter)
   * @param {string} language - Language code (en/sw)
   * @returns {Promise<Object>} - { resources: [...] }
   */
  async getAll(language = 'en') {
    const response = await fetch(`${API_BASE_URL}/resources?language=${language}`);

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
   * @param {boolean} flaggedOnly - Filter only flagged conversations
   * @returns {Promise<Object>} - { conversations: [...] }
   */
  async getConversations(token, flaggedOnly = false) {
    const params = flaggedOnly ? '?flagged_only=true' : '';
    const response = await fetch(`${API_BASE_URL}/admin/conversations${params}`, {
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
   * @returns {Promise<Object>} - { total, green, amber, red, flagged, alerts }
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

  /**
   * Get all alerts (requires auth token)
   * @param {string} token - Admin auth token
   * @returns {Promise<Object>} - { alerts: [{ id, session_id, risk_level, message_preview, created_at }] }
   */
  async getAlerts(token) {
    const response = await fetch(`${API_BASE_URL}/admin/alerts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    return response.json();
  },
};

/**
 * Counsellors API - Public and admin endpoints
 */
export const counsellorsApi = {
  /**
   * Get all available counsellors (public)
   * @returns {Promise<Array>} - Array of counsellor objects
   */
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/counsellors/`);

    if (!response.ok) {
      throw new Error('Failed to fetch counsellors');
    }

    return response.json();
  },

  /**
   * Request a counsellor (public)
   * @param {Object} data - Request data
   * @param {string} data.counsellor_id - UUID of counsellor
   * @param {string} data.session_id - Session identifier
   * @returns {Promise<Object>} - Counsellor request object
   */
  async requestCounsellor({ counsellor_id, session_id }) {
    const response = await fetch(`${API_BASE_URL}/counsellors/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        counsellor_id,
        session_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to request counsellor' }));
      throw new Error(error.detail || 'Failed to request counsellor');
    }

    return response.json();
  },

  /**
   * Get all counsellor requests (admin only)
   * @param {string} token - Admin auth token
   * @returns {Promise<Array>} - Array of requests with counsellor details
   */
  async getAllRequests(token) {
    const response = await fetch(`${API_BASE_URL}/counsellors/admin/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }

    return response.json();
  },

  /**
   * Update request status (admin only)
   * @param {string} token - Admin auth token
   * @param {string} requestId - UUID of request
   * @param {string} status - New status (pending|assigned|resolved)
   * @returns {Promise<Object>} - Updated request
   */
  async updateRequestStatus(token, requestId, status) {
    const response = await fetch(
      `${API_BASE_URL}/counsellors/admin/requests/${request_id}?status=${status}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update request status');
    }

    return response.json();
  },

  /**
   * Create a new counsellor (admin only)
   * @param {string} token - Admin auth token
   * @param {Object} data - Counsellor data
   * @param {string} data.name - Counsellor name
   * @param {string} data.email - Email
   * @param {string} data.phone - Phone (optional)
   * @param {boolean} data.is_available - Availability status
   * @returns {Promise<Object>} - Created counsellor
   */
  async createCounsellor(token, { name, email, phone, is_available }) {
    const response = await fetch(`${API_BASE_URL}/counsellors/admin/counsellors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        is_available,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create counsellor');
    }

    return response.json();
  },

  /**
   * Get all counsellors (admin only)
   * @param {string} token - Admin auth token
   * @returns {Promise<Array>} - Array of all counsellors
   */
  async getAllCounsellors(token) {
    const response = await fetch(`${API_BASE_URL}/counsellors/admin/counsellors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch counsellors');
    }

    return response.json();
  },

  /**
   * Delete a counsellor (admin only)
   * @param {string} token - Admin auth token
   * @param {string} counsellorId - UUID of counsellor
   * @returns {Promise<Object>} - Success message
   */
  async deleteCounsellor(token, counsellorId) {
    const response = await fetch(`${API_BASE_URL}/counsellors/admin/counsellors/${counsellorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete counsellor');
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
