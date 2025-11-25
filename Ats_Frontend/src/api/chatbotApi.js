import { BASE_URL } from './api';

// Helper function to get auth headers
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

export const chatbotAPI = {
  sendMessage: async (message) => {
    try {
      // For now, we'll use a simple response system
      // In the future, you can integrate with an AI service like OpenAI, or create a backend endpoint
      
      // Check if we have a backend endpoint for chatbot
      const token = localStorage.getItem("jwtToken");
      if (token) {
        try {
          const response = await fetch(`${BASE_URL}/api/chatbot/message`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message }),
          });

          if (response.ok) {
            const data = await response.json();
            return data.response || data.message || "I'm here to help!";
          }
        } catch (error) {
          // Backend endpoint doesn't exist, use fallback
          console.log('Chatbot endpoint not available, using fallback');
        }
      }

      // Fallback: Simple rule-based responses
      return generateFallbackResponse(message);
    } catch (error) {
      console.error('Chatbot API error:', error);
      return generateFallbackResponse(message);
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

// Fallback response generator for when backend is not available
const generateFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  // ATS-specific responses
  if (lowerMessage.includes('how to') || lowerMessage.includes('how do i')) {
    return "I can guide you through various ATS features. For example:\n• To create a job: Go to Jobs → Create New Job\n• To add a candidate: Go to Candidates → Add Candidate\n• To schedule an interview: Go to Applications → Select Application → Schedule Interview\n\nWhat specific task would you like help with?";
  }

  if (lowerMessage.includes('status') || lowerMessage.includes('track')) {
    return "You can track application statuses in the Applications section. Each application shows its current status (Applied, Screening, Interview, Offer, Hired, Rejected). Would you like to know more about a specific application?";
  }

  if (lowerMessage.includes('report') || lowerMessage.includes('analytics')) {
    return "Reports are available in the Reports section. You can view recruiter performance, application statistics, and other analytics. What type of report are you interested in?";
  }

  if (lowerMessage.includes('client') || lowerMessage.includes('company')) {
    return "You can manage clients in the Clients section. Each client can have multiple job postings. Would you like to know more about client management?";
  }

  // General responses
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! Feel free to come back anytime if you need assistance with your ATS.";
  }

  // Default response
  return "I understand you're asking about: \"" + message + "\". I can help you with questions about jobs, candidates, applications, interviews, and general ATS features. Could you be more specific about what you'd like to know?";
};

