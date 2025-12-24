import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authApi } from '../../api/authApi';
import type { User } from '../../types/auth';
import { sessionHelper } from '../../utils/sessionHelper';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock dependencies
vi.mock('../../api/authApi');
vi.mock('../../utils/sessionHelper');

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  isVerified: true,
  createdAt: new Date('2024-01-01'),
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should update state when login is called', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.login(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(sessionHelper.markLoggedIn).toHaveBeenCalled();
  });

  it('should clear state when logout is called', async () => {
    vi.mocked(authApi.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // First login
    act(() => {
      result.current.login(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(authApi.logout).toHaveBeenCalled();
    expect(sessionHelper.markLoggedOut).toHaveBeenCalled();
  });

  it('should fetch user data when checkAuth is called and user exists', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle no user gracefully when checkAuth is called', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should set loading state during checkAuth', async () => {
    // eslint-disable-next-line no-unused-vars
    let resolvePromise: ((value: User) => void) | undefined;
    const promise = new Promise<User>((_resolve) => {
      resolvePromise = _resolve;
    });

    vi.mocked(authApi.getCurrentUser).mockReturnValue(promise);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Start checking
    act(() => {
      void result.current.checkAuth();
    });

    // Should be loading immediately
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the promise
    if (resolvePromise !== undefined) {
      act(() => {
        resolvePromise(mockUser);
      });
    }

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should not check auth multiple times', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Call checkAuth multiple times
    await act(async () => {
      await result.current.checkAuth();
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    await act(async () => {
      await result.current.checkAuth();
    });

    // Should only call API once
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = consoleError;
  });
});
