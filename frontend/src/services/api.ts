import axios from 'axios';
import type { AuthResponse, ResearchPaper, Category, EmailLog, DashboardAnalytics, User, ChatResponse, AppNotification } from '../types';


const formatUrl = (url?: string): string => {
  if (!url) return '';

  let cleanUrl = url.trim();

  let protocol = 'https://';
  if (cleanUrl.startsWith('http://')) {
    protocol = 'http://';
    cleanUrl = cleanUrl.slice(7);
  } else if (cleanUrl.startsWith('https://')) {
    protocol = 'https://';
    cleanUrl = cleanUrl.slice(8);
  } else if (cleanUrl.startsWith('//')) {
    protocol = 'https://';
    cleanUrl = cleanUrl.slice(2);
  }

  const slashIdx = cleanUrl.indexOf('/');
  let host = slashIdx !== -1 ? cleanUrl.slice(0, slashIdx) : cleanUrl;
  let path = slashIdx !== -1 ? cleanUrl.slice(slashIdx) : '';

  if (host && !host.includes('.') && host !== 'localhost' && !host.includes(':')) {
    host = `${host}.onrender.com`;
  }
  while (host.includes('.onrender.com.onrender.com')) {
    host = host.replace('.onrender.com.onrender.com', '.onrender.com');
  }

  path = path.replace(/\/+$/, '');

  return `${protocol}${host}${path}`;
};

const rawServerUrl = import.meta.env.VITE_SERVER_URL;
const rawApiUrl = import.meta.env.VITE_API_URL;

let parsedServerUrl = rawServerUrl ? formatUrl(rawServerUrl) : '';
let parsedApiUrl = rawApiUrl ? formatUrl(rawApiUrl) : '';

// Ensure parsedServerUrl does NOT end with /api/v1
if (parsedServerUrl.endsWith('/api/v1')) {
  parsedServerUrl = parsedServerUrl.slice(0, -7);
}

// Compute final API_BASE_URL ensuring /api/v1 is ALWAYS present
let computedApiUrl = '';
if (parsedApiUrl) {
  if (parsedApiUrl.endsWith('/api/v1')) {
    computedApiUrl = parsedApiUrl;
  } else {
    computedApiUrl = `${parsedApiUrl.replace(/\/+$/, '')}/api/v1`;
  }
} else if (parsedServerUrl) {
  computedApiUrl = `${parsedServerUrl}/api/v1`;
} else {
  computedApiUrl = import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1';
}

export const API_BASE_URL = computedApiUrl;

// Compute final SERVER_BASE_URL
export const SERVER_BASE_URL = parsedServerUrl ||
  (computedApiUrl.startsWith('http') ? computedApiUrl.replace(/\/api\/v1\/?$/, '') : '') ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('promptflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },
  register: async (email: string, full_name: string, password: string, department: string, role: 'admin' | 'faculty' = 'faculty'): Promise<User> => {
    const res = await api.post('/auth/register', { email, full_name, password, department, role });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateMe: async (data: { full_name?: string; department?: string }): Promise<User> => {
    const res = await api.put('/auth/me', data);
    return res.data;
  }
};

export const paperService = {
  list: async (filters?: { query?: string; department?: string; author?: string; category?: string; year?: number }): Promise<ResearchPaper[]> => {
    const params: any = {};
    if (filters?.query) params.query = filters.query;
    if (filters?.department && filters.department !== 'All') params.department = filters.department;
    if (filters?.author) params.author = filters.author;
    if (filters?.category && filters.category !== 'All') params.category = filters.category;
    if (filters?.year) params.year = filters.year;
    const res = await api.get('/papers', { params });
    return res.data;
  },
  getById: async (id: number): Promise<ResearchPaper> => {
    const res = await api.get(`/papers/${id}`);
    return res.data;
  },
  uploadPdf: async (file: File, departmentHint?: string): Promise<ResearchPaper> => {
    const formData = new FormData();
    formData.append('file', file);
    if (departmentHint) formData.append('department_hint', departmentHint);
    const res = await api.post('/papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  delete: async (id: number): Promise<any> => {
    const res = await api.delete(`/papers/${id}`);
    return res.data;
  },
  update: async (id: number, data: Partial<ResearchPaper>): Promise<ResearchPaper> => {
    const res = await api.put(`/papers/${id}`, data);
    return res.data;
  }
};

export const categoryService = {
  list: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data;
  },
  createCustom: async (name: string, description?: string): Promise<Category> => {
    const res = await api.post('/categories', { name, description, is_custom: true });
    return res.data;
  },
  delete: async (id: number): Promise<any> => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};

export const emailService = {
  simulate: async (sender: string, subject: string, body: string, department_hint?: string): Promise<EmailLog> => {
    const res = await api.post('/emails/simulate', { sender, subject, body, department_hint });
    return res.data;
  },
  getLogs: async (limit: number = 20): Promise<EmailLog[]> => {
    const res = await api.get('/emails/logs', { params: { limit } });
    return res.data;
  },
  sync: async (): Promise<any> => {
    const res = await api.post('/emails/sync');
    return res.data;
  }
};

export const analyticsService = {
  getDashboardData: async (): Promise<DashboardAnalytics> => {
    const res = await api.get('/analytics');
    return res.data;
  }
};

export interface ExportFilters {
  department?: string;
  category?: string;
  year?: number;
  start_year?: number;
  end_year?: number;
  publication_type?: string;
  author?: string;
  quartile?: string;
  query?: string;
}

const buildExportFilename = (
  prefix: string,
  ext: string,
  filters?: ExportFilters
): string => {
  const parts: string[] = [prefix];

  if (filters?.department && filters.department !== 'All') {
    parts.push(`dept_${filters.department.trim().replace(/[^a-zA-Z0-9]+/g, '_')}`);
  }
  if (filters?.category && filters.category !== 'All') {
    parts.push(`cat_${filters.category.trim().replace(/[^a-zA-Z0-9]+/g, '_')}`);
  }
  if (filters?.publication_type && filters.publication_type !== 'All') {
    parts.push(`type_${filters.publication_type.trim().replace(/[^a-zA-Z0-9]+/g, '_')}`);
  }
  if (filters?.author && filters.author.trim()) {
    parts.push(`author_${filters.author.trim().slice(0, 15).replace(/[^a-zA-Z0-9]+/g, '_')}`);
  }
  if (filters?.year) {
    parts.push(`year_${filters.year}`);
  } else {
    if (filters?.start_year && filters?.end_year) {
      parts.push(`years_${filters.start_year}_to_${filters.end_year}`);
    } else if (filters?.start_year) {
      parts.push(`from_${filters.start_year}`);
    } else if (filters?.end_year) {
      parts.push(`until_${filters.end_year}`);
    }
  }
  if (filters?.quartile && filters.quartile !== 'All') {
    parts.push(`quartile_${filters.quartile.trim().replace(/[^a-zA-Z0-9]+/g, '_')}`);
  }
  if (filters?.query && filters.query.trim()) {
    const cleanQuery = filters.query.trim().slice(0, 15).replace(/[^a-zA-Z0-9]+/g, '_');
    parts.push(`search_${cleanQuery}`);
  }

  if (parts.length === 1) {
    parts.push('all');
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const randId = Math.floor(1000 + Math.random() * 9000);

  parts.push(`${dateStr}_${timeStr}_${randId}`);
  return `${parts.join('_')}.${ext}`;
};

export const exportService = {
  downloadExcel: async (filters?: ExportFilters) => {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== 'All') params.append('department', filters.department);
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_year) params.append('start_year', filters.start_year.toString());
    if (filters?.end_year) params.append('end_year', filters.end_year.toString());
    if (filters?.publication_type && filters.publication_type !== 'All') params.append('publication_type', filters.publication_type);
    if (filters?.author && filters.author.trim()) params.append('author', filters.author.trim());
    if (filters?.quartile && filters.quartile !== 'All') params.append('quartile', filters.quartile);
    if (filters?.query && filters.query.trim()) params.append('query', filters.query.trim());

    const res = await api.get(`/export/excel?${params.toString()}`, { responseType: 'blob' });
    const filename = buildExportFilename('research_publications', 'xlsx', filters);
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  downloadPdf: async (filters?: ExportFilters) => {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== 'All') params.append('department', filters.department);
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_year) params.append('start_year', filters.start_year.toString());
    if (filters?.end_year) params.append('end_year', filters.end_year.toString());
    if (filters?.publication_type && filters.publication_type !== 'All') params.append('publication_type', filters.publication_type);
    if (filters?.author && filters.author.trim()) params.append('author', filters.author.trim());
    if (filters?.quartile && filters.quartile !== 'All') params.append('quartile', filters.quartile);
    if (filters?.query && filters.query.trim()) params.append('query', filters.query.trim());

    const res = await api.get(`/export/pdf?${params.toString()}`, { responseType: 'blob' });
    const filename = buildExportFilename('research_publications_report', 'pdf', filters);
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const adminService = {
  listUsers: async (): Promise<User[]> => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  retrainMl: async (): Promise<any> => {
    const res = await api.post('/admin/retrain-ml');
    return res.data;
  }
};

export const chatService = {
  query: async (message: string): Promise<ChatResponse> => {
    const res = await api.post('/chat/query', { message });
    return res.data;
  }
};

export const notificationService = {
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    return res.data.unread_count ?? 0;
  },
  list: async (unreadOnly: boolean = false, limit: number = 20): Promise<AppNotification[]> => {
    const res = await api.get('/notifications', { params: { unread_only: unreadOnly, limit } });
    return res.data;
  },

  markRead: async (id: number): Promise<AppNotification> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (): Promise<any> => {
    const res = await api.post('/notifications/mark-all-read');
    return res.data;
  },
  create: async (data: { title: string; message: string; type?: string; link_paper_id?: number }): Promise<AppNotification> => {
    const res = await api.post('/notifications', data);
    return res.data;
  },
  delete: async (id: number): Promise<any> => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  }
};

export const healthService = {
  check: async (): Promise<{ status: string; system: string; version: string; ml_engine: string }> => {
    const res = await api.get('/health');
    return res.data;
  }
};

export default api;


