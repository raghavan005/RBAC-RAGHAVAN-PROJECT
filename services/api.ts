/**
 * services/api.ts
 *
 * Central Axios instance for all Express backend calls.
 * Handles:
 *  - Base URL from NEXT_PUBLIC_API_URL
 *  - Attaching Bearer token from localStorage on every request
 *  - Automatic access-token refresh on 401 responses (token rotation)
 *  - Redirecting to /login when both tokens are expired
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh-token cookie
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: refresh on 401 ─────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401s that haven't been retried yet,
    // and skip the refresh endpoint itself to avoid infinite loops.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
        const { accessToken } = data;

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
        }

        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Both tokens expired — clear storage and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  number?: number;
  phone?: string;
  role: string;
  status: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    number?: number;
  }) => api.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<{ accessToken: string }>("/auth/refresh"),

  profile: () => api.get<{ user: AuthUser }>("/auth/profile"),
};

// ── Members ───────────────────────────────────────────────────────────────────
export interface Member {
  _id: string;
  name: string;
  email: string;
  number?: number;
  phone?: string;
  role: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MembersResponse {
  members: Member[];
  pagination: Pagination;
}

export interface MemberQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const membersApi = {
  list: (query: MemberQuery = {}) =>
    api.get<MembersResponse>("/members", { params: query }),

  get: (id: string) => api.get<{ member: Member }>(`/members/${id}`),

  create: (data: Partial<Member> & { password: string }) =>
    api.post<{ member: Member }>("/members", data),

  update: (id: string, data: Partial<Member> & { password?: string }) =>
    api.put<{ member: Member }>(`/members/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/members/${id}`),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export interface AuditLog {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string } | string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

export const auditLogsApi = {
  list: (query: { page?: number; limit?: number } = {}) =>
    api.get<AuditLogsResponse>("/audit-logs", { params: query }),
};

export default api;
