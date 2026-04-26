// api.js — Updated API service with JWT token management
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Token management ─────────────────────────────────────────────────────────
function getToken() {
  const token  = localStorage.getItem("lifeline_admin_token");
  const expiry = Number(localStorage.getItem("lifeline_token_expiry") || 0);
  if (!token || Date.now() > expiry) {
    localStorage.removeItem("lifeline_admin_token");
    localStorage.removeItem("lifeline_token_expiry");
    return null;
  }
  return token;
}

function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  if (res.status === 401) {
    localStorage.removeItem("lifeline_admin_token");
    localStorage.removeItem("lifeline_token_expiry");
    throw new Error("Session expired — please log in again");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}


// ── Chat API ─────────────────────────────────────────────────────────────────
export const chatApi = {
  async sendMessage({ message, language = "en", sessionId, name }) {
    return request("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        language,
        session_id: sessionId,
        name: name || undefined,
      }),
    });
    // Response now includes:
    // { reply, risk_level, risk_score, confidence, explanation, hotlines, session_id, escalated }
  },
};


// ── Resources API ─────────────────────────────────────────────────────────────
export const resourcesApi = {
  async getByLocation(location = "Kenya", language = "en") {
    return request(`/resources?location=${encodeURIComponent(location)}&language=${language}`);
  },
};


// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  isLoggedIn() {
    return !!getToken();
  },

  async login(password, totpCode) {
    const body = { password };
    if (totpCode) body.totp_code = totpCode;
    return request("/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    // Returns { access_token, token_type, expires_in, mfa_required }
  },

  logout() {
    localStorage.removeItem("lifeline_admin_token");
    localStorage.removeItem("lifeline_token_expiry");
  },

  async getStats() {
    return request("/admin/stats", { headers: authHeaders() });
    // Returns { total, low, medium, high, critical, green, amber, red }
  },

  async getConversations({ flagged, riskLevel, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (flagged   !== undefined) params.set("flagged", flagged);
    if (riskLevel !== undefined) params.set("risk_level", riskLevel);
    if (limit)                   params.set("limit", limit);
    return request(`/admin/conversations?${params}`, { headers: authHeaders() });
  },

  async getAlerts() {
    return request("/admin/alerts", { headers: authHeaders() });
  },

  async acknowledgeAlert(alertId) {
    return request(`/admin/alerts/${alertId}/acknowledge`, {
      method: "PATCH",
      headers: authHeaders(),
    });
  },

  async getCounsellors() {
    return request("/admin/counsellors", { headers: authHeaders() });
  },

  async getRequests() {
    return request("/admin/requests", { headers: authHeaders() });
  },
};


// ── Counsellors API ───────────────────────────────────────────────────────────
export const counsellorsApi = {
  async getAll() {
    return request("/counsellors/");
  },

  async requestCounsellor(counsellorId, sessionId) {
    return request("/counsellors/request", {
      method: "POST",
      body: JSON.stringify({ counsellor_id: counsellorId, session_id: sessionId }),
    });
  },
};


// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  async check() {
    return request("/health");
  },
};