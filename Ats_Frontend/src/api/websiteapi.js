// Use the same BASE_URL as api.js - update this to match your backend URL
// const BASE_URL = "https://atsapi.primesourcellp.com";
const BASE_URL = "http://localhost:8080";
// const BASE_URL = "https://braeden-nonobligatory-groundedly.ngrok-free.dev";

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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ✅ Website Application API
export const websiteApplicationAPI = {
  // Get all website applications
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/forms`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get website application by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get applications by job ID
  getByJobId: async (jobId) => {
    const response = await fetch(`${BASE_URL}/api/forms/job/${jobId}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // ✅ Update application status (move here!)
  updateStatus: async (id, status) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/status?status=${status}`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // View resume for website application
  viewResume: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/resume/url`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    const resumeUrl = data.resumeUrl;
    
    // Rewrite localhost:8080 URLs to match current BASE_URL
    if (resumeUrl) {
      return resumeUrl.replace(/http:\/\/localhost:8080/g, BASE_URL);
    }
    return resumeUrl;
  },

  // Download resume for website application
  downloadResume: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/resume/download`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }
};

// Job API
export const jobAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};
