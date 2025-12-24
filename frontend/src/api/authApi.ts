import axios from 'axios';

import type {
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
  User,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  async signup(data: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post<SignUpResponse>('/api/auth/signup', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await api.get<{ user: User }>('/api/auth/me', {
      validateStatus: (status) => {
        // Treat both 200 and 401 as valid responses (not errors)
        return status === 200 || status === 401;
      },
    });

    // If 401, user is not authenticated
    if (response.status === 401) {
      return null;
    }

    // If 200, return the user data
    return response.data.user;
  },
};
