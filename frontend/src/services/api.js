import axios from 'axios';

// Vite proxy forwards /api to http://localhost:5000/api
const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dfg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // ── Authentication ────────────────────────────────────────────────────────

  /** Traditional password login */
  login: async (email, password) => {
    const res = await client.post('/login', { email, password });
    return res.data;
  },

  /** Register a new operator with name/email/password */
  register: async (userData) => {
    const res = await client.post('/register', userData);
    return res.data;
  },

  /** Send OTP to email or mobile */
  sendOtp: async (identifier, type = 'email') => {
    const res = await client.post('/auth/send-otp', { identifier, type });
    return res.data;
  },

  /** Verify submitted OTP code; auto-registers user if new */
  verifyOtp: async (identifier, code, name = 'New Customer', role = 'Customer') => {
    const res = await client.post('/auth/verify-otp', { identifier, code, name, role });
    return res.data;
  },

  /** Google OAuth profile payload — creates/logs in customer */
  googleAuth: async (payload) => {
    const res = await client.post('/auth/google', payload);
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await client.get('/me');
    return res.data;
  },

  /** Download registered_users.xlsx (Admin only) */
  downloadUsersExcel: () => {
    const token = localStorage.getItem('dfg_token') || '';
    window.open(`${API_BASE}/users/excel-download?token=${encodeURIComponent(token)}`, '_blank');
  },

  /** Fetch all customers and login history (Admin only) */
  getAdminCustomers: async () => {
    const res = await client.get('/admin/customers');
    return res.data;
  },

  /** Delete single customer by ID (Master Admin only) */
  deleteCustomer: async (userId) => {
    const res = await client.delete(`/admin/customers/${userId}`);
    return res.data;
  },

  /** Bulk delete customers or purge test data (Master Admin only) */
  bulkDeleteCustomers: async (payload) => {
    const res = await client.post('/admin/customers/bulk-delete', payload);
    return res.data;
  },

  // ── Health ─────────────────────────────────────────────────────────────────
  checkHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // ── Dashboard & Statistics ─────────────────────────────────────────────────
  getDashboard: async () => {
    const res = await client.get('/dashboard');
    return res.data;
  },
  getStatistics: async () => {
    const res = await client.get('/statistics');
    return res.data;
  },

  // ── Detection & Data Ingestion ─────────────────────────────────────────────
  uploadDataset: async (formData) => {
    const res = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  runDetection: async (payload) => {
    const res = await client.post('/detect', payload);
    return res.data;
  },
  loadDemoData: async (scenario = 'default') => {
    const res = await client.post('/load-demo', { scenario });
    return res.data;
  },

  // ── Network Graph ──────────────────────────────────────────────────────────
  getGraphData: async (limit = 70) => {
    const res = await client.get(`/graph?limit=${limit}`);
    return res.data;
  },

  // ── AI Threat Explanation ──────────────────────────────────────────────────
  explainThreat: async (payload) => {
    const res = await client.post('/explain', payload);
    return res.data;
  },

  // ── Detection History ──────────────────────────────────────────────────────
  getHistory: async (params = {}) => {
    const res = await client.get('/history', { params });
    return res.data;
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  getReport: async () => {
    const res = await client.get('/report');
    return res.data;
  },
  getReportCsvUrl: () => `${API_BASE}/report/download`,

  // ── Calendar heatmap ───────────────────────────────────────────────────────
  getCalendarData: async (year, month) => {
    const res = await client.get('/calendar', { params: { year, month } });
    return res.data;
  },
  getCalendar: async (year, month) => {
    const res = await client.get('/calendar', { params: { year, month } });
    return res.data;
  },

  // ── Chart time-series ──────────────────────────────────────────────────────
  getChartData: async (period = 'week', date = null) => {
    const params = { period };
    if (date) params.date = date;
    const res = await client.get('/chart-data', { params });
    return res.data;
  },
};

export default api;
