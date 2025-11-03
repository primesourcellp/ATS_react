// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://atsapi.primesourcellp.com/api",
  TIMEOUT: 10000, // 10 seconds
};

// Helper function to get auth headers
export const getAuthHeaders = (contentType = "application/json") => {
  const token = localStorage.getItem("jwtToken");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};

// Helper function to handle API responses
export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Generic API request function
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("jwtToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle empty success (e.g. DELETE 204)
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};
