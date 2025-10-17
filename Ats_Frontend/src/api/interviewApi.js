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

// Interview API
export const interviewAPI = {

getAll: async () => {
  const response = await fetch(`${BASE_URL}/api/interviews/all-with-client`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  return handleResponse(response); // this will be array of InterviewDTO
},


  // Search interviews
  search: async (searchTerm, page = 0, size = 20) => {
    const response = await fetch(
      `${BASE_URL}/api/interviews/search?search=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`,
      {
        method: "GET",
        headers: getAuthHeaders()
      }
    );
    const data = await handleResponse(response);
    return {
      content: data.content || [],
      totalPages: data.totalPages || 0,
      totalElements: data.totalElements || 0
    };
  },

  // Get interview by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Update interview
  update: async (id, interviewData) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(interviewData)
    });
    return handleResponse(response);
  },

  // Delete interview
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/api/interviews/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return { success: true, message: "Interview deleted successfully" };
  },

  // Schedule interview
  schedule: async (applicationId, interviewData) => {
    const { interviewDate, interviewTime, endTime } = interviewData;
    const response = await fetch(
      `${BASE_URL}/api/interviews/schedule/${applicationId}?interviewDate=${interviewDate}&interviewTime=${interviewTime}&endTime=${endTime}`,
      {
        method: "POST",
        headers: getAuthHeaders()
      }
    );
    return handleResponse(response);
  }
};

export default interviewAPI;