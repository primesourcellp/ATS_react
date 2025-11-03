// Notification API
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
  
  try {
    return await response.json();
  } catch (error) {
    return response.text();
  }
};

// Notification API
export const notificationAPI = {
  // Get all notifications
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Delete notification
  delete: async (notificationId) => {
    const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Create notification (for testing)
  create: async (notificationData) => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData)
    });
    return handleResponse(response);
  }
};
