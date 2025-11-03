// api/clientApi.js
const BASE_URL = "https://atsapi.primesourcellp.com";

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
  
  // For DELETE operations that might not return content
  if (response.status === 204) {
    return { success: true };
  }
  
  try {
    return await response.json();
  } catch (error) {
    return { success: true };
  }
};

// Client API functions
export const clientAPI = {
  // Get all clients
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Search clients
  search: async (name) => {
    const response = await fetch(`${BASE_URL}/api/clients/search?name=${encodeURIComponent(name)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get client by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create client
  create: async (clientData) => {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData)
    });
    return handleResponse(response);
  },

  // Update client
  update: async (id, clientData) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData)
    });
    return handleResponse(response);
  },

  // Delete client
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Job API functions
export const jobAPI = {
  // Create job for a client
  create: async (jobData) => {
    const response = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });
    return handleResponse(response);
  },

  // Delete job
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/jobs/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};