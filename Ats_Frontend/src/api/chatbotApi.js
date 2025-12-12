import { BASE_URL } from './api';

// Helper function to get auth headers
const getAuthHeaders = (contentType = "application/json") => {
  const token = sessionStorage.getItem("jwtToken");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
};

export const chatbotAPI = {
  sendMessage: async (message) => {
    try {
      // Try to use OpenAI-powered backend endpoint
      const token = sessionStorage.getItem("jwtToken");
      if (token) {
        try {
          const response = await fetch(`${BASE_URL}/api/chatbot/message`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message }),
          });

          if (response.ok) {
            const data = await response.json();
            // Check if there's an error in the response
            if (data.error) {
              console.error('Chatbot service error:', data.error);
              return `I encountered an issue: ${data.error}. Please check if OpenAI is configured correctly.`;
            }
            return data.response || data.message || "I'm here to help!";
          } else {
            // Handle HTTP errors
            const errorData = await response.json().catch(() => ({}));
            console.error('Chatbot endpoint error:', response.status, errorData);
            if (response.status === 500 && errorData.error) {
              return `Service error: ${errorData.error}. Please check OpenAI configuration.`;
            }
          }
        } catch (error) {
          // Network or parsing error
          console.error('Chatbot endpoint error:', error);
          return "I'm having trouble connecting to the AI service. Please check your connection and try again.";
        }
      } else {
        return "Please log in to use the AI chatbot.";
      }

      // If we reach here, something went wrong
      return "I'm having trouble connecting to the AI service. Please check your connection and try again.";
    } catch (error) {
      console.error('Chatbot API error:', error);
      return "I encountered an error: " + (error.message || "Unknown error") + ". Please try again.";
    }
  },

  getHistory: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/chatbot/history`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },

  clearHistory: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/chatbot/history`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  },
};

