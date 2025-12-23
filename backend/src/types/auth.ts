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
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface VerifyTokenResponse {
  message: string;
  user: UserResponse;
}
