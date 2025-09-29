import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Chat API
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
};

// RAG API
export const ragAPI = {
  uploadDocument: (formData) => {
    return api.post('/rag/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getKnowledgeBase: () => api.get('/rag/knowledge-base'),
};

export default api;