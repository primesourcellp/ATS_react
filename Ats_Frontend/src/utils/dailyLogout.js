import { authAPI } from '../api/api';

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Store the login date when user logs in
 */
export const setLoginDate = () => {
  const today = getTodayDate();
  localStorage.setItem('loginDate', today);
};

/**
 * Check if user should be logged out (if it's a new day)
 * Returns true if logout should happen, false otherwise
 */
export const shouldLogoutDaily = () => {
  const loginDate = localStorage.getItem('loginDate');
  const today = getTodayDate();
  
  // If no login date stored, don't logout (user might be logging in for first time)
  if (!loginDate) {
    return false;
  }
  
  // If login date is different from today, logout
  return loginDate !== today;
};

/**
 * Perform automatic daily logout
 */
export const performDailyLogout = async () => {
  const token = localStorage.getItem('jwtToken');
  
  // Call logout API if token exists
  if (token) {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Server logout failed during daily logout:', err);
    }
  }
  
  // Clear all local storage
  localStorage.clear();
  
  // Redirect to login page
  if (window.location.pathname !== '/' && 
      window.location.pathname !== '/login' && 
      window.location.pathname !== '/forgot-password') {
    window.location.href = '/login';
  }
};

/**
 * Initialize daily logout check
 * This should be called when the app loads
 * Returns a cleanup function to clear all intervals/timeouts
 */
export const initDailyLogoutCheck = () => {
  // Check immediately
  if (shouldLogoutDaily()) {
    performDailyLogout();
    return () => {}; // Return no-op cleanup function
  }
  
  let checkInterval = null;
  let midnightTimeout = null;
  let dailyCheckInterval = null;
  
  // Set up interval to check every minute
  checkInterval = setInterval(() => {
    if (shouldLogoutDaily()) {
      performDailyLogout();
    }
  }, 60000); // Check every minute
  
  // Also set up a check at midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  // Set timeout to check at midnight
  midnightTimeout = setTimeout(() => {
    if (shouldLogoutDaily()) {
      performDailyLogout();
    }
    
    // After midnight check, set up daily interval
    dailyCheckInterval = setInterval(() => {
      if (shouldLogoutDaily()) {
        performDailyLogout();
      }
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }, msUntilMidnight);
  
  // Return cleanup function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    if (midnightTimeout) {
      clearTimeout(midnightTimeout);
    }
    if (dailyCheckInterval) {
      clearInterval(dailyCheckInterval);
    }
  };
};

