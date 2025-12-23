import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authApi } from '../api/authApi';
import type { SignUpRequest } from '../types/auth';

function SignUpForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpRequest>({
    email: '',
    password: '',
    username: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError(
        'Username must be 3-20 characters and contain only letters, numbers, and underscores'
      );
      return false;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError(
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return false;
    }

    // Confirm password match
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
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
        await authApi.signup(formData);
        setSuccess(true);
      } catch (err) {
        if (err instanceof Error && 'response' in err) {
          const axiosError = err as {
            response?: { data?: { error?: string } };
          };
          setError(
            axiosError.response?.data?.error ?? 'Failed to create account'
          );
        } else {
          setError('Failed to create account');
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  if (success) {
    return (
      <div
        style={{
          padding: '40px',
          maxWidth: '500px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h1>✅ Check Your Email</h1>
        <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>
          We&apos;ve sent a verification link to{' '}
          <strong>{formData.email}</strong>
        </p>
        <p style={{ marginTop: '10px', color: '#666' }}>
          Click the link in the email to verify your account and log in.
        </p>
        <button
          onClick={() => {
            void navigate('/');
          }}
          style={{
            marginTop: '30px',
            padding: '12px 30px',
            fontSize: '1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Sign Up</h1>
      <p style={{ color: '#666', marginTop: '10px' }}>
        Create your account to get started
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="username"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
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
            value={formData.email}
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

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="confirmPassword"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
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
          }}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account?{' '}
        <button
          onClick={() => {
            void navigate('/login');
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
          Log In
        </button>
      </p>
    </div>
  );
}

export default SignUpForm;
