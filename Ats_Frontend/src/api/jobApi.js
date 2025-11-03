const BASE_URL = "https://atsapi.primesourcellp.com";

// 🔹 Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("jwtToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle empty success (e.g. DELETE 204)
    if (response.status === 204) {
      return { success: true, message: "Deleted successfully" };
    }

    // Try to parse JSON, fallback to text
    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    // Handle error responses
    if (!response.ok) {
      throw {
        success: false,
        status: response.status,
        message:
          (typeof data === "object" && (data.error || data.message)) ||
          data ||
          `HTTP error! status: ${response.status}`,
        data,
      };
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw {
      success: false,
      status: error.status || 500,
      message: error.message || "Unexpected error occurred",
      data: error.data || null,
    };
  }
};

// 🔹 FormData API request (for file uploads)
const apiFormDataRequest = async (endpoint, formData) => {
  const token = localStorage.getItem("jwtToken");

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      throw {
        success: false,
        status: response.status,
        message:
          (typeof data === "object" && (data.error || data.message)) ||
          data ||
          `HTTP error! status: ${response.status}`,
        data,
      };
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw {
      success: false,
      status: error.status || 500,
      message: error.message || "Unexpected error occurred",
      data: error.data || null,
    };
  }
};

// 🔹 Job-related API calls
export const jobAPI = {
  getAll: () => apiRequest("/jobs"),
  getById: (id) => apiRequest(`/jobs/${id}`),
  create: (jobData, clientId) =>
    apiRequest(`/jobs/add?clientId=${clientId}`, {
      method: "POST",
      body: JSON.stringify(jobData),
    }),
  update: (id, jobData) =>
    apiRequest(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    }),
  delete: (id) =>
    apiRequest(`/jobs/${id}`, {
      method: "DELETE",
    }),
  search: (term) => apiRequest(`/jobs/search/${encodeURIComponent(term)}`),
  searchBySkill: (skill) =>
    apiRequest(`/jobs/search/skill/${encodeURIComponent(skill)}`),
  filterByLocation: (location) =>
    apiRequest(`/jobs/location/${encodeURIComponent(location)}`),
  filterByDate: (date) => apiRequest(`/jobs/date?createdAt=${date}`),
};

// 🔹 Candidate-related API calls
export const candidateAPI = {
  getByJobId: (jobId) => apiRequest(`/api/candidates/job/${jobId}`),
  getDetails: (candidateId, jobId) =>
    apiRequest(`/api/candidates/${candidateId}/details?jobId=${jobId}`),
  create: (formData) => apiFormDataRequest("/api/candidates", formData),
  viewResume: async (candidateId) => {
    const response = await fetch(`${BASE_URL}/api/candidates/view/${candidateId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.resumeUrl;
  },
  downloadResume: (candidateId) =>
    fetch(`${BASE_URL}/api/candidates/download/${candidateId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    }),
};

// 🔹 Client-related API calls
export const clientAPI = {
  getAll: () => apiRequest("/api/clients"),
  getById: (id) => apiRequest(`/api/clients/${id}`),
  create: (clientData) =>
    apiRequest("/api/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    }),
  update: (id, clientData) =>
    apiRequest(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    }),
  delete: (id) =>
    apiRequest(`/api/clients/${id}`, {
      method: "DELETE",
    }),
};

// 🔹 Auth-related API calls
export const authAPI = {
  logout: (token) =>
    apiRequest("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  getProfile: () => apiRequest("/api/auth/profile"),
  validateToken: () => apiRequest("/api/auth/validate"),
};

// 🔹 User-related API calls
export const userAPI = {
  getAll: () => apiRequest("/api/users"),
  getById: (id) => apiRequest(`/api/users/${id}`),
  create: (userData) =>
    apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  update: (id, userData) =>
    apiRequest(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
  delete: (id) =>
    apiRequest(`/api/users/${id}`, {
      method: "DELETE",
    }),
};
export const jobStatus = {
  // ...other methods
  updateStatus: (jobId, newStatus) =>
    apiRequest(`/jobs/${jobId}/status?status=${newStatus}`, {
      method: "PUT",
    }),
};


// 🔹 Dashboard statistics API calls
export const dashboardAPI = {
  getStats: () => apiRequest("/api/dashboard/stats"),
  getRecentJobs: (limit = 5) =>
    apiRequest(`/api/dashboard/recent-jobs?limit=${limit}`),
  getRecentCandidates: (limit = 5) =>
    apiRequest(`/api/dashboard/recent-candidates?limit=${limit}`),
};

// Export helpers
export { apiRequest, BASE_URL };
