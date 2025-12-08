// Use the same BASE_URL as api.js - update this to match your backend URL
// const BASE_URL = "https://atsapi.primesourcellp.com";
const BASE_URL = "http://localhost:8080";
// const BASE_URL = "https://braeden-nonobligatory-groundedly.ngrok-free.dev";

// ===================== Helper Functions =====================
const getAuthHeaders = (contentType = "application/json") => {
  const token = localStorage.getItem("jwtToken");
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
};

const createFormData = (formData) => {
  if (!formData) return new FormData();
  
  const data = new FormData();
  if (formData.candidateId) data.append("candidateId", formData.candidateId);
  if (formData.jobId) data.append("jobId", formData.jobId);
  if (formData.status) data.append("status", formData.status);
  if (formData.resumeFile) data.append("resumeFile", formData.resumeFile);
  if (formData.useMasterResume !== undefined)
    data.append("useMasterResume", formData.useMasterResume);
  return data;
};

// ===================== Application API =====================
export const applicationAPI = {
  // Get all applications
  getAll: async (url = "/api/applications") => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get by candidate name
  getByCandidateName: async (name) => {
    const response = await fetch(
      `${BASE_URL}/api/applications/candidate/name/${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Create new application
  create: async (formData) => {
    if (!formData) {
      throw new Error("Form data is required");
    }
    
    if (!formData.candidateId) {
      throw new Error("Candidate ID is required");
    }
    
    if (!formData.jobId) {
      throw new Error("Job ID is required");
    }
    
    const token = localStorage.getItem("jwtToken");
    const url = `${BASE_URL}/api/applications/apply/${formData.candidateId}/job/${formData.jobId}`;

    let options;
    if (formData.resumeFile) {
      const fd = createFormData(formData);
      options = {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd, // ✅ do not set Content-Type for FormData
      };
    } else {
      options = {
        method: "POST",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({ status: formData.status }),
      };
    }

    const response = await fetch(url, options);
    return handleResponse(response);
  },

  // Update
  update: async (id, formData) => {
    if (!formData) {
      throw new Error("Form data is required");
    }
    
    const token = localStorage.getItem("jwtToken");

    if (formData.resumeFile) {
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      fd.append("resumeFile", formData.resumeFile);
      
      const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      return handleResponse(response);
    } else {
      // For status-only updates, send as form data to match backend expectations
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      if (formData.statusDescription) fd.append("statusDescription", formData.statusDescription);
      
      const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      return handleResponse(response);
    }
  },

  // Delete
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return { success: true, message: "Application deleted successfully" };
  },

  // Download resume
  downloadResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${BASE_URL}/api/applications/${id}/resume/download`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download resume. Status: ${response.status}`);
    }
    return response.blob();
  },

  // View resume
  viewResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${BASE_URL}/api/applications/${id}/resume/file`, // ✅ Use proxy endpoint
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    // Get the S3 presigned URL from JSON response
    const data = await response.json();
    const url = data.url || data.resumeUrl;
    
    // Rewrite localhost:8080 URLs to match current BASE_URL
    if (url) {
      return url.replace(/http:\/\/localhost:8080/g, BASE_URL);
    }
    return url;
  },
};

// ===================== Interview API =====================
export const interviewAPI = {
  schedule: async (applicationId, { interviewDate, interviewTime, endTime, description }) => {
    let url = `${BASE_URL}/api/interviews/schedule/${applicationId}?interviewDate=${interviewDate}&interviewTime=${interviewTime}&endTime=${endTime}`;
    if (description) {
      url += `&description=${encodeURIComponent(description)}`;
    }
    const response = await fetch(url, { method: "POST", headers: getAuthHeaders() });
    return handleResponse(response);
  },
};

// ===================== Candidate API =====================
export const candidateAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/candidates`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== Job API =====================
export const jobAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
