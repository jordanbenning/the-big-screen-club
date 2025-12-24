import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types/auth';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    // Simple validation - just check if fields are not empty
    if (formData.email.trim() === '') {
      setError('Email or username is required');
      return false;
    }

    if (formData.password.trim() === '') {
      setError('Password is required');
      return false;
    }

    return true;
  };

  const handleForgotPassword = () => {
    void navigate('/forgot-password');
  };

  const handleResendVerification = () => {
    setResendLoading(true);
    setResendSuccess(false);

    void (async () => {
      try {
        await authApi.resendVerification(formData.email);
        setResendSuccess(true);
        setError(null);
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } };
          };
          setError(
            axiosError.response?.data?.error ??
              'Failed to resend verification email'
          );
        } else {
          setError('Failed to resend verification email');
        }
      } finally {
        setResendLoading(false);
      }
    })();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    void (async () => {
      try {
        const response = await authApi.login({ ...formData, rememberMe });

        // Update auth context with user data
        login(response.user);

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // The PublicOnlyRoute will automatically redirect to dashboard
        void navigate('/dashboard');
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } };
          };
          const errorMessage =
            axiosError.response?.data?.error ?? 'Login failed';
          setError(errorMessage);

          // Show resend verification button if email is not verified
          if (
            errorMessage === 'Please verify your email before logging in' &&
            formData.email !== ''
          ) {
            setShowResendVerification(true);
          } else {
            setShowResendVerification(false);
          }
        } else {
          setError('Login failed');
          setShowResendVerification(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Log In</h1>
      <p style={{ color: '#666', marginTop: '10px' }}>
        Welcome back! Please log in to your account
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Email or Username
          </label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email or username"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
            }}
          />
        </div>

        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked);
              }}
              style={{
                marginRight: '8px',
                cursor: 'pointer',
              }}
            />
            Remember me
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.95rem',
            }}
          >
            Forgot password?
          </button>
        </div>

        {error !== null && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '5px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {resendSuccess && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#e7f5e7',
              color: '#2d6e2d',
              borderRadius: '5px',
              marginBottom: '20px',
            }}
          >
            Verification email sent! Please check your inbox.
          </div>
        )}

        {showResendVerification && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              backgroundColor: resendLoading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: resendLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1.1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <button
          onClick={() => {
            void navigate('/signup');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '1rem',
          }}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
