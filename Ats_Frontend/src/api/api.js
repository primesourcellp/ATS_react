
// const BASE_URL = "https://atsapi.primesourcellp.com";
// const BASE_URL = "http://localhost:8080";


const BASE_URL = "http://talentprimeapi.primesourcellp.com";

// const BASE_URL = "https://talentprimeapi.primesourcellp.com";
// const BASE_URL = "http://112.133.204.15:9090";

// const BASE_URL = "https://talentprimeapi.primesourcellp.com:9090";

// const BASE_URL = "https://talentprimeapi.primesourcellp.com";

// const BASE_URL = "http://talentprimeapi.primesourcellp.com:9090";



// ===================== Helper Functions =====================

// Helper function to rewrite localhost:8080 URLs to current BASE_URL
// This ensures file URLs work correctly when backend returns hardcoded localhost URLs
export const rewriteFileUrl = (url) => {
  if (!url) return url;
  // Replace localhost:8080 with current BASE_URL
  return url.replace(/http:\/\/localhost:8080/g, BASE_URL);
};
const getAuthHeaders = (contentType = "application/json") => {
  const token = localStorage.getItem("jwtToken");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("WARNING: No JWT token found in localStorage. User may need to log in again.");
  }
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  // Bypass ngrok browser warning for free tier
  headers["ngrok-skip-browser-warning"] = "true";
  return headers;
};

const handleResponse = async (response, skipLogoutOn403 = false) => {
  // Handle empty success (e.g. DELETE 204)
  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  // Check if response is ngrok warning page (HTML instead of JSON)
  if (!isJson && contentType && contentType.includes("text/html")) {
    const text = await response.text();
    if (text.includes("ngrok") || text.includes("ERR_NGROK")) {
      throw new Error("ngrok warning page detected. Please check your ngrok tunnel configuration or use ngrok-skip-browser-warning header.");
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      const existingToken = localStorage.getItem("jwtToken");
      if (existingToken) {
        localStorage.removeItem("jwtToken");
        if (
          window.location.pathname !== "/" &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/forgot-password"
        ) {
          window.location.href = "/login";
        }
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Unauthorized");
    }
    if (response.status === 403) {
      // Don't logout on 403 if skipLogoutOn403 is true (for user creation endpoints)
      if (!skipLogoutOn403) {
        const existingToken = localStorage.getItem("jwtToken");
        if (existingToken) {
          localStorage.removeItem("jwtToken");
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/forgot-password"
          ) {
            window.location.href = "/login";
          }
          throw new Error("Session expired. Please log in again.");
        }
      }
      const errorData = isJson 
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => "");
      throw new Error(
        errorData.message || errorData.error || errorData || "Forbidden: You don't have permission to perform this action."
      );
    }
    const errorData = isJson 
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");
    throw new Error(
      errorData.message || errorData.error || errorData || `HTTP error! status: ${response.status}`
    );
  }

  if (isJson) {
    return await response.json();
  }
  return await response.text();
};

// ===================== AUTH API =====================
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyOTP: async (email, otp) => {
    const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ email, otpCode: otp }),
    });
    return handleResponse(response);
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ email, otpCode: otp, newPassword }),
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  validateToken: async () => {
    const response = await fetch(`${BASE_URL}/api/auth/validate`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== USER API =====================
export const userAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getRecruiters: async () => {
    const response = await fetch(`${BASE_URL}/api/users/recruiters`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createAdmin: async (userData) => {
    // This endpoint is for initial admin registration (first time setup)
    // It's allowed from the login/register page but blocked from user management UI
    const response = await fetch(`${BASE_URL}/api/users/create-admin`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }, // No auth required for first admin
      body: JSON.stringify(userData),
    });
    // Use custom error handling to prevent logout on 403
    if (!response.ok) {
      const errorData = await response.text().catch(() => response.statusText);
      throw new Error(errorData || `HTTP error! status: ${response.status}`);
    }
    // Backend returns plain text "Admin registered successfully"
    // Read response as text first (can only read response body once)
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      return "Admin registered successfully";
    }
    // Try to parse as JSON if it looks like JSON, otherwise return as text
    try {
      const jsonData = JSON.parse(responseText);
      return jsonData.message || jsonData || "Admin registered successfully";
    } catch {
      // Not JSON, return as plain text
      return responseText;
    }
  },

  createSecondaryAdmin: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-secondary-admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response, true); // Skip logout on 403 for user creation
  },

  createRecruiter: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-recruiter`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response, true); // Skip logout on 403 for user creation
  },

  createUser: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response, true); // Skip logout on 403 for user creation
  },

  update: async (id, userData) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  updateRestrictions: async (id, restrictions) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}/restrictions`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(restrictions),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  checkEmailExists: async (email) => {
    const response = await fetch(`${BASE_URL}/api/users/check-email/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  checkUsernameExists: async (username) => {
    const response = await fetch(`${BASE_URL}/api/users/check-username/${encodeURIComponent(username)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== CANDIDATE API =====================
export const candidateAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/candidates`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${id}?includeApplications=true`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByStatus: async (status) => {
    const response = await fetch(`${BASE_URL}/api/candidates/status/${status}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByJobId: async (jobId) => {
    const response = await fetch(`${BASE_URL}/api/candidates/job/${jobId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getDetails: async (candidateId, jobId) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${candidateId}/details?jobId=${jobId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  search: async (keyword) => {
    const response = await fetch(`${BASE_URL}/api/candidates/filter?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

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
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: formData,
    });
    return handleResponse(response);
  },

  update: async (id, candidateData, resumeFile) => {
    const formData = new FormData();
    
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
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/candidates/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  parseResume: async (resumeFile) => {
    const formData = new FormData();
    formData.append("resumeFile", resumeFile);

    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/parse-only`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: formData,
    });
    return handleResponse(response);
  },

  viewResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/resume/${id}`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  },

  downloadResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/download/${id}`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download resume. Status: ${response.status}`);
    }
    
    return response.blob();
  },

  getCount: async () => {
    const response = await fetch(`${BASE_URL}/api/candidates/count`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== JOB API =====================
export const jobAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/jobs`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getActive: async () => {
    const response = await fetch(`${BASE_URL}/jobs/active`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true"
      },
    });
    return handleResponse(response);
  },

  create: async (jobData, clientId) => {
    const response = await fetch(`${BASE_URL}/jobs/add?clientId=${clientId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  update: async (id, jobData) => {
    const response = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (jobId, newStatus) => {
    const response = await fetch(`${BASE_URL}/jobs/${jobId}/status?status=${newStatus}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  search: async (term) => {
    const response = await fetch(`${BASE_URL}/jobs/search/${encodeURIComponent(term)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  searchBySkill: async (skill) => {
    const response = await fetch(`${BASE_URL}/jobs/search/skill/${encodeURIComponent(skill)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  filterByLocation: async (location) => {
    const response = await fetch(`${BASE_URL}/jobs/location/${encodeURIComponent(location)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  filterByDate: async (date) => {
    const response = await fetch(`${BASE_URL}/jobs/date?createdAt=${date}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getCount: async () => {
    const response = await fetch(`${BASE_URL}/jobs/counts`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== JOB STATUS API =====================
export const jobStatus = {
  updateStatus: async (jobId, newStatus) => {
    const response = await fetch(`${BASE_URL}/jobs/${jobId}/status?status=${newStatus}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== APPLICATION API =====================
export const applicationAPI = {
  getAll: async (url = "/api/applications") => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByCandidateName: async (name) => {
    const response = await fetch(`${BASE_URL}/api/applications/candidate/name/${encodeURIComponent(name)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (formData) => {
    if (!formData) {
      throw new Error("Form data is required");
    }
    
    const token = localStorage.getItem("jwtToken");
    const url = `${BASE_URL}/api/applications/apply/${formData.candidateId}/job/${formData.jobId}`;

    // Always use FormData to support both file and non-file requests
    const fd = new FormData();
    if (formData.status) fd.append("status", formData.status);
    if (formData.statusDescription) fd.append("statusDescription", formData.statusDescription);
    if (typeof formData.useMasterResume !== "undefined") {
      fd.append("useMasterResume", formData.useMasterResume);
    }
    if (formData.resumeFile) {
      fd.append("resumeFile", formData.resumeFile);
    }

    const options = {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: fd,
    };

    const response = await fetch(url, options);
    return handleResponse(response);
  },

  update: async (id, formData) => {
    if (!formData) {
      throw new Error("Form data is required");
    }
    
    const token = localStorage.getItem("jwtToken");

    if (formData.resumeFile) {
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      if (formData.statusDescription) fd.append("statusDescription", formData.statusDescription);
      fd.append("resumeFile", formData.resumeFile);
      
      const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
        body: fd,
      });
      return handleResponse(response);
    } else {
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      if (formData.statusDescription) fd.append("statusDescription", formData.statusDescription);
      
      const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
        body: fd,
      });
      return handleResponse(response);
    }
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  viewResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/applications/${id}/resume/file`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    });
    
    if (response.status === 404) {
      throw new Error("Resume not found for this application.");
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.url) {
      throw new Error("Resume not found for this application.");
    }

    return data.url;
  },

  downloadResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/applications/${id}/resume/download`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download resume. Status: ${response.status}`);
    }
    
    return response.blob();
  },

  getCount: async () => {
    const response = await fetch(`${BASE_URL}/api/applications/count`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== INTERVIEW API =====================
export const interviewAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/interviews/all-with-client`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  search: async (searchTerm, page = 0, size = 20) => {
    const response = await fetch(
      `${BASE_URL}/api/interviews/search?search=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    const data = await handleResponse(response);
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0,
    };
  },

  schedule: async (applicationId, interviewData) => {
    const { interviewDate, interviewTime, endTime, description } = interviewData;
    let url = `${BASE_URL}/api/interviews/schedule/${applicationId}?interviewDate=${interviewDate}&interviewTime=${interviewTime}&endTime=${endTime}`;
    if (description) {
      url += `&description=${encodeURIComponent(description)}`;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  update: async (id, interviewData) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(interviewData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getCount: async () => {
    const response = await fetch(`${BASE_URL}/api/interviews/count/today`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  complete: async (interviewId, completionNotes) => {
    let url = `${BASE_URL}/api/interviews/${interviewId}/complete`;
    if (completionNotes) {
      url += `?completionNotes=${encodeURIComponent(completionNotes)}`;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getDetails: async (id) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}/details`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== CLIENT API =====================
export const clientAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAllForAdmin: async () => {
    const response = await fetch(`${BASE_URL}/api/clients/all`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  search: async (name) => {
    const response = await fetch(`${BASE_URL}/api/clients/search?name=${encodeURIComponent(name)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (clientData) => {
    const response = await fetch(`${BASE_URL}/api/clients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  update: async (id, clientData) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  updateRecruiters: async (id, permissions) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}/recruiters`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(permissions || []),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  addJobToClient: async (clientId, jobId) => {
    // First get the job details
    const jobResponse = await fetch(`${BASE_URL}/jobs/${jobId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const jobData = await handleResponse(jobResponse);
    
    // Get the client to include in the job object
    const clientResponse = await fetch(`${BASE_URL}/api/clients/${clientId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const client = await handleResponse(clientResponse);
    
    // Create job object with client reference for the backend
    const jobToAssign = {
      ...jobData,
      client: {
        id: client.id,
        clientName: client.clientName || client.client_name
      }
    };
    
    // Assign it to the client using the client endpoint
    const response = await fetch(`${BASE_URL}/api/clients/${clientId}/jobs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(jobToAssign),
    });
    return handleResponse(response);
  },
};

// ===================== WEBSITE APPLICATION API =====================
export const websiteApplicationAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/forms`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByJobId: async (jobId) => {
    const response = await fetch(`${BASE_URL}/api/forms/job/${jobId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/status?status=${status}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  viewResume: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/resume/url`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.resumeUrl;
  },

  downloadResume: async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}/resume/download`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  },
};

// ===================== REPORT API =====================
export const reportAPI = {
  getRecruiterReports: async ({ range, startDate, endDate, recruiterId } = {}) => {
    const params = new URLSearchParams();
    if (range) params.append("range", range);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (recruiterId) params.append("recruiterId", recruiterId);

    const url = `${BASE_URL}/api/reports/recruiters${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(null),
    });
    return handleResponse(response);
  },

  getMyReport: async ({ range, startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (range) params.append("range", range);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const url = `${BASE_URL}/api/reports/recruiters/me${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(null),
    });
    return handleResponse(response);
  },
};

// ===================== NOTIFICATION API =====================
export const notificationAPI = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUnreadCount: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  markAsRead: async (notificationId) => {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  markAllAsRead: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (notificationId) => {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (notificationData) => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData),
    });
    return handleResponse(response);
  },
};

// Candidate Email API
export const candidateEmailAPI = {
  getPreview: async () => {
    const response = await fetch(`${BASE_URL}/api/candidate-emails/preview`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAllCandidates: async () => {
    const response = await fetch(`${BASE_URL}/api/candidate-emails/candidates`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  sendBulkEmails: async (candidateIds, companyUrl, customMessage) => {
    const response = await fetch(`${BASE_URL}/api/candidate-emails/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ candidateIds, companyUrl, customMessage }),
    });
    return handleResponse(response);
  },

  sendToAll: async (companyUrl, customMessage) => {
    const response = await fetch(`${BASE_URL}/api/candidate-emails/send-all`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ companyUrl, customMessage }),
    });
    return handleResponse(response);
  },
};

// Resume Matching API
export const resumeMatchingAPI = {
  matchResume: async (resumeFile) => {
    const formData = new FormData();
    formData.append("resume", resumeFile);

    const response = await fetch(`${BASE_URL}/api/resume-matching/match`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(null), // Don't set Content-Type for FormData
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
    });
    return handleResponse(response);
  },

  matchResumeWithJob: async (resumeFile, jobId) => {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobId", jobId);

    const response = await fetch(`${BASE_URL}/api/resume-matching/match-job`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(null), // Don't set Content-Type for FormData
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

// ===================== TIME TRACKING API =====================
export const timeTrackingAPI = {
  // Record login
  recordLogin: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/login/${userId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Record logout
  recordLogout: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/logout/${userId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all active sessions (currently working users)
  getAllActive: async () => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/active`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get current user's session
  getCurrentSession: async () => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/current`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get user sessions
  getUserSessions: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/user/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get user sessions by date
  getUserSessionsByDate: async (userId, date) => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/user/${userId}/date?date=${date}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get total working minutes today for a user
  getTotalWorkingMinutesToday: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/time-tracking/user/${userId}/total-today`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ===================== USER ACTIVITY API =====================
export const userActivityAPI = {
  // Ping to update current user's activity
  ping: async () => {
    const response = await fetch(`${BASE_URL}/api/user-activity/ping`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all users with their status
  getAllUsersWithStatus: async () => {
    const response = await fetch(`${BASE_URL}/api/user-activity/all`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get specific user's status
  getUserStatus: async (userId) => {
    const response = await fetch(`${BASE_URL}/api/user-activity/user/${userId}/status`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update all user statuses
  updateAllStatuses: async () => {
    const response = await fetch(`${BASE_URL}/api/user-activity/update-all`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Export BASE_URL for use in other files if needed
export { BASE_URL };

