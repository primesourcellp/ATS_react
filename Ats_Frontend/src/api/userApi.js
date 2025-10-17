// api/userApi.js
const BASE_URL = "http://localhost:8080";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("jwtToken");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `HTTP error! status: ${response.status}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    return { success: true };
  }
};

// User API functions
export const userAPI = {
  // Get all users
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create admin user
  createAdmin: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Create recruiter user
  createRecruiter: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-recruiter`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Create regular user
  createUser: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Update user
  update: async (id, userData) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Delete user
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Check if email exists
  checkEmailExists: async (email) => {
    const response = await fetch(`${BASE_URL}/api/users/check-email/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Check if username exists
  checkUsernameExists: async (username) => {
    const response = await fetch(`${BASE_URL}/api/users/check-username/${encodeURIComponent(username)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};