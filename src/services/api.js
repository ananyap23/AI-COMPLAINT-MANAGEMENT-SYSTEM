const TOKEN_KEY = 'campus_voice_auth_token';
const USER_KEY = 'campus_voice_user';

export const api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (endpoint !== '/auth/login') {
          // Token expired or invalid session
          this.clearSession();
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  // Auth methods
  async login(identifier, password, expectedRole) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, expectedRole }),
    });
    this.setSession(res.token, res.user);
    return res;
  },

  async registerStudent(data) {
    const res = await this.request('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setSession(res.token, res.user);
    return res;
  },

  async getMe() {
    const res = await this.request('/auth/me');
    return res.user;
  },

  logout() {
    this.clearSession();
  },

  // Complaints CRUD
  async getComplaints() {
    const res = await this.request('/complaints');
    return res.complaints;
  },

  async submitComplaint(complaintData) {
    const res = await this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
    return res.complaint;
  },

  async updateComplaintStatus(id, { status, remarks, rejectionReason, priority }) {
    const res = await this.request(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks, rejectionReason, priority }),
    });
    return res.complaint;
  },

  async assignStaff(id, { staffName, department, priority, remarks }) {
    const res = await this.request(`/complaints/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ staffName, department, priority, remarks }),
    });
    return res.complaint;
  },

  async reassignComplaint(id, { targetScope, department, reason }) {
    const res = await this.request(`/complaints/${id}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ targetScope, department, reason }),
    });
    return res.complaint;
  },

  async submitFeedback(id, { rating, comment }) {
    const res = await this.request(`/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return res.complaint;
  },

  // Staff and Stats
  async getStaff() {
    const res = await this.request('/staff');
    return res.staff;
  },

  async getStats() {
    const res = await this.request('/stats');
    return res;
  },
};
