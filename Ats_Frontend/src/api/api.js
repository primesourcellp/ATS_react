// ===================== UNIFIED API FILE =====================
// All frontend API calls consolidated into one file

// const BASE_URL = "https://atsapi.primesourcellp.com";
const BASE_URL = "http://localhost:8080";

// ===================== Helper Functions =====================
const getAuthHeaders = (contentType = "application/json") => {
  const token = localStorage.getItem("jwtToken");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};

const handleResponse = async (response) => {
  // Handle empty success (e.g. DELETE 204)
  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyOTP: async (email, otp) => {
    const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otpCode: otp }),
    });
    return handleResponse(response);
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createAdmin: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  createRecruiter: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-recruiter`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${BASE_URL}/api/users/create-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id, userData) => {
    const response = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return handleResponse(response);
  },

  viewResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/candidates/resume/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
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
      headers: {},
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

    let options;
    if (formData.resumeFile) {
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      fd.append("resumeFile", formData.resumeFile);
      options = {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
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
      const fd = new FormData();
      if (formData.status) fd.append("status", formData.status);
      
      const response = await fetch(`${BASE_URL}/api/applications/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resume. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  },

  downloadResume: async (id) => {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(`${BASE_URL}/api/applications/${id}/resume/download`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
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
    const { interviewDate, interviewTime, endTime } = interviewData;
    const response = await fetch(
      `${BASE_URL}/api/interviews/schedule/${applicationId}?interviewDate=${interviewDate}&interviewTime=${interviewTime}&endTime=${endTime}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
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

  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
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

// Export BASE_URL for use in other files if needed
export { BASE_URL };

