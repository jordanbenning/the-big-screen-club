export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignUpResponse {
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
}
