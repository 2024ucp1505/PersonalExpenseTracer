import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Accounts ────────────────────────────────────────────
export const accountsAPI = {
  getAll:  ()           => api.get('/accounts'),
  getOne:  (id)         => api.get(`/accounts/${id}`),
  create:  (data)       => api.post('/accounts', data),
  update:  (id, data)   => api.put(`/accounts/${id}`, data),
  delete:  (id)         => api.delete(`/accounts/${id}`),
};

// ── Categories ──────────────────────────────────────────
export const categoriesAPI = {
  getAll:  ()           => api.get('/categories'),
  create:  (data)       => api.post('/categories', data),
  update:  (id, data)   => api.put(`/categories/${id}`, data),
  delete:  (id)         => api.delete(`/categories/${id}`),
};

// ── Transactions ────────────────────────────────────────
export const transactionsAPI = {
  getAll:  (params) => api.get('/transactions', { params }),
  create:  (data)   => api.post('/transactions', data),
  delete:  (id)     => api.delete(`/transactions/${id}`),
};

// ── Budgets ─────────────────────────────────────────────
export const budgetsAPI = {
  getAll:  (params) => api.get('/budgets', { params }),
  create:  (data)   => api.post('/budgets', data),
  delete:  (id)     => api.delete(`/budgets/${id}`),
};

// ── Dashboard ───────────────────────────────────────────
export const dashboardAPI = {
  get: (params) => api.get('/dashboard', { params }),
};

// ── AI Insights ─────────────────────────────────────────
export const insightsAPI = {
  query: (question) => api.post('/insights', { query: question }),
};

export default api;
