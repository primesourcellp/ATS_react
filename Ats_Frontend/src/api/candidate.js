// api/candidate.js
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Candidate API functions
export const candidateAPI = {
  // Get all candidates
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/candidates`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get candidates by status
  getByStatus: async (status) => {
    const response = await fetch(`${BASE_URL}/api/candidates/status/${status}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Search candidates
  search: async (keyword) => {
    const response = await fetch(`${BASE_URL}/api/candidates/filter?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get candidate by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${id}?includeApplications=true`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create candidate
  create: async (candidateData, resumeFile) => {
    const formData = new FormData();
    formData.append("candidate", JSON.stringify(candidateData));
    
    if (resumeFile) {
      formData.append("resumeFile", resumeFile);
    }

    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Update candidate
  update: async (id, candidateData, resumeFile) => {
    const formData = new FormData();
    
    // Append all candidate data fields
    Object.keys(candidateData).forEach(key => {
      formData.append(key, candidateData[key]);
    });
    
    if (resumeFile) {
      formData.append("resumePdf", resumeFile);
    }

    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    return handleResponse(response);
  },

  // Delete candidate
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true, message: "Candidate deleted successfully" };
  },

  // Parse resume
  parseResume: async (resumeFile) => {
    const formData = new FormData();
    formData.append("resumeFile", resumeFile);

    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/parse-only`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    return handleResponse(response);
  },

  // View resume
  viewResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/view/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    // Get the JSON response with resume URL
    const data = await response.json();
    
    if (!data.resumeUrl) {
      throw new Error("No resume available for this candidate");
    }
    
    // Return the resume URL for direct access
    return data.resumeUrl;
  },

  // Download resume
  downloadResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/download/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download resume. Status: ${response.status}`);
    }
    
    return response.blob();
  }
};

// Job API functions (for assign/copy functionality)
export const jobAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/jobs`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  search: async (keyword) => {
    const response = await fetch(`${BASE_URL}/api/jobs/search?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  assignCandidate: async (candidateId, jobId) => {
    const response = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ candidateId, jobId })
    });
    return handleResponse(response);
  }
};