/**
 * Session Helper - Client-side session state tracking
 *
 * Helps avoid unnecessary API calls by tracking whether a user is likely logged in.
 * This prevents 401 errors for logged-out users on public pages.
 */

const AUTH_STATE_KEY = 'authState';

export const sessionHelper = {
  /**
   * Mark the user as logged in (sets localStorage flag)
   */
  markLoggedIn: (): void => {
    localStorage.setItem(AUTH_STATE_KEY, 'logged-in');
  },

  /**
   * Mark the user as logged out (removes localStorage flag)
   */
  markLoggedOut: (): void => {
    localStorage.removeItem(AUTH_STATE_KEY);
  },

  /**
   * Check if the user is likely logged in based on localStorage
   * Returns true if we think there might be an active session
   */
  isLikelyLoggedIn: (): boolean => {
    return localStorage.getItem(AUTH_STATE_KEY) === 'logged-in';
  },
};
