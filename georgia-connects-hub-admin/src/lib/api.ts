import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/admin/login", { email, password });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: any) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}/type`, data);
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getPosts: async (params?: any) => {
    const response = await api.get("/admin/posts", { params });
    return response.data;
  },
  approvePost: async (
    id: string,
    action: "approve" | "reject",
    rejectionReason?: string
  ) => {
    const response = await api.put(`/admin/posts/${id}/approve`, {
      action,
      rejectionReason,
    });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },
};

// Badges API
export const badgesAPI = {
  getBadges: async (params?: any) => {
    const response = await api.get("/admin/badges", { params });
    return response.data;
  },
  createBadge: async (data: any) => {
    const response = await api.post("/admin/badges", data);
    return response.data;
  },
  updateBadge: async (id: string, data: any) => {
    const response = await api.put(`/admin/badges/${id}`, data);
    return response.data;
  },
  deleteBadge: async (id: string) => {
    const response = await api.delete(`/admin/badges/${id}`);
    return response.data;
  },
  assignBadge: async (data: any) => {
    const response = await api.post("/admin/badges/assign", data);
    return response.data;
  },
  unassignBadge: async (userBadgeId: string) => {
    const response = await api.delete(`/admin/badges/unassign/${userBadgeId}`);
    return response.data;
  },
  getBadgeStats: async () => {
    const response = await api.get("/admin/badges/stats");
    return response.data;
  },
};

// User type definition
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Agenda API
export const agendaAPI = {
  getAgenda: async () => {
    const response = await api.get("/admin/agenda");
    return response.data;
  },

  createAgendaItem: async (item: any) => {
    const response = await api.post("/admin/agenda", item);
    return response.data;
  },

  updateAgendaItem: async (id: string, item: any) => {
    const response = await api.put(`/admin/agenda/${id}`, item);
    return response.data;
  },

  deleteAgendaItem: async (id: string) => {
    const response = await api.delete(`/admin/agenda/${id}`);
    return response.data;
  },
};

// Admin API Client
export const adminApiClient = {
  setAuthToken: (token: string) => {
    localStorage.setItem("admin_auth_token", token);
  },

  clearAuth: () => {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("adminUser");
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/admin/login", credentials);
    if (response.data.data?.token) {
      localStorage.setItem("admin_auth_token", response.data.data.token);
    }
    if (response.data.data?.user) {
      localStorage.setItem(
        "adminUser",
        JSON.stringify(response.data.data.user)
      );
    }
    return response;
  },

  logout: async () => {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("adminUser");
  },

  getCurrentUser: async (): Promise<User> => {
    // Call the /auth/me endpoint to verify the token and get current user
    const response = await api.get("/auth/me");
    return response.data.data.user;
  },
};

// Check-ins API
export const checkInsAPI = {
  getCheckIns: async (params?: {
    page?: number;
    limit?: number;
    day?: string;
    agendaId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.day) queryParams.append("day", params.day);
    if (params?.agendaId) queryParams.append("agendaId", params.agendaId);

    const response = await api.get(`/admin/checkins?${queryParams.toString()}`);
    return response.data;
  },

  getCheckInsAnalytics: async () => {
    const response = await api.get("/admin/checkins/analytics");
    return response.data;
  },
};

export default api;
