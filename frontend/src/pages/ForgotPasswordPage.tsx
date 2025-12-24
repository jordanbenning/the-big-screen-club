import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import type { ForgotPasswordRequest } from '../types/auth';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  };

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return false;
    }

    return true;
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
        const data: ForgotPasswordRequest = { email };
        await authApi.forgotPassword(data);
        setSuccess(true);
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } };
          };
          setError(
            axiosError.response?.data?.error ?? 'Failed to send reset email'
          );
        } else {
          setError('Failed to send reset email');
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleBackToLogin = () => {
    void navigate('/login');
  };

  if (success) {
    return (
      <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
        <h1>Check Your Email</h1>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '5px',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            Password reset email sent!
          </p>
          <p style={{ margin: '0' }}>
            If an account exists with this email, a password reset link will be
            sent. Please check your inbox and follow the instructions.
          </p>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          The link will expire in 24 hours. If you don&apos;t receive the email,
          please check your spam folder.
        </p>

        <button
          onClick={handleBackToLogin}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1.1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Forgot Password</h1>
      <p style={{ color: '#666', marginTop: '10px' }}>
        Enter your email address and we&apos;ll send you a link to reset your
        password.
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
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
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
            marginBottom: '15px',
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <button
          type="button"
          onClick={handleBackToLogin}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1.1rem',
            backgroundColor: 'white',
            color: '#007bff',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
