import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaBriefcase, FaUserTie, FaFileAlt, FaCalendarAlt, FaThumbsUp, FaThumbsDown, FaSearch, FaHistory, FaClock, FaPlus, FaBars, FaTrash } from 'react-icons/fa';
import { chatbotAPI } from '../../api/chatbotApi';
import { jobAPI, candidateAPI, applicationAPI, interviewAPI, clientAPI, candidateEmailAPI, notificationAPI } from '../../api/api';

const Chatbot = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Recruiter';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Welcome ${username}! How can I assist you today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  // Auto-complete suggestions based on input
  useEffect(() => {
    if (input.trim().length > 0) {
      const suggestions = [
        'show jobs', 'show candidates', 'show applications', 'show interviews',
        'list jobs', 'list candidates', 'list applications', 'list clients',
        'help', 'features', 'dashboard', 'reports',
        'schedule interview', 'application status', 'shortlisted',
        'yesterday list', 'candidates yesterday', 'candidates today',
        'candidates on date', 'find candidates by date',
        'find jobs for me', 'match jobs', 'jobs for my skills',
        'find job with java experience', 'jobs in bangalore',
        'recommend jobs', 'best jobs for me',
        'java', 'java jobs', 'python jobs', 'react jobs',
        'show java', 'find python', 'search react',
        'recruiter activity', 'what did recruiter do today', 'recruiter summary'
      ].filter(s => s.toLowerCase().includes(input.toLowerCase().trim()));
      setAutoCompleteSuggestions(suggestions.slice(0, 5));
      setShowAutoComplete(suggestions.length > 0);
    } else {
      setAutoCompleteSuggestions([]);
      setShowAutoComplete(false);
    }
  }, [input]);


  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatbotSearchHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(Array.isArray(history) ? history : []);
      } catch (error) {
        console.error('Error loading search history:', error);
        setSearchHistory([]);
      }
    }
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chatbotChatHistory');
    if (savedChats) {
      try {
        const chats = JSON.parse(savedChats);
        setChatHistory(Array.isArray(chats) ? chats : []);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setChatHistory([]);
      }
    }
  }, []);

  // Save current chat to history when messages change
  useEffect(() => {
    if (currentChatId && messages.length > 1) {
      const chatData = {
        id: currentChatId,
        messages: messages,
        hasUserInteracted: hasUserInteracted,
        timestamp: new Date().toISOString(),
        title: messages.find(m => m.sender === 'user')?.text?.substring(0, 50) || 'New Chat'
      };

      setChatHistory(prev => {
        const updated = prev.filter(chat => chat.id !== currentChatId);
        updated.unshift(chatData);
        const limited = updated.slice(0, 50); // Keep last 50 chats
        
        try {
          localStorage.setItem('chatbotChatHistory', JSON.stringify(limited));
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
        
        return limited;
      });
    }
  }, [messages, currentChatId, hasUserInteracted]);

  // Create new chat
  const handleNewChat = () => {
    // Save current chat if it has messages
    if (currentChatId && messages.length > 1) {
      const chatData = {
        id: currentChatId,
        messages: messages,
        hasUserInteracted: hasUserInteracted,
        timestamp: new Date().toISOString(),
        title: messages.find(m => m.sender === 'user')?.text?.substring(0, 50) || 'New Chat'
      };

      setChatHistory(prev => {
        const updated = prev.filter(chat => chat.id !== currentChatId);
        updated.unshift(chatData);
        const limited = updated.slice(0, 50);
        
        try {
          localStorage.setItem('chatbotChatHistory', JSON.stringify(limited));
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
        
        return limited;
      });
    }

    // Start fresh chat
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setHasUserInteracted(false);
    setMessages([
      {
        id: 1,
        text: `Welcome ${username}! How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setInput('');
    setIsLoading(false);
    setIsTyping(false);
    setTypingText('');
  };

  // Load a chat from history
  const handleLoadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
      setHasUserInteracted(chat.hasUserInteracted || false);
      setInput('');
      setIsLoading(false);
      setIsTyping(false);
      setTypingText('');
      setShowChatSidebar(false);
    }
  };

  // Delete a chat from history
  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    const updated = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updated);
    
    try {
      localStorage.setItem('chatbotChatHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }

    // If deleting current chat, start new one
    if (currentChatId === chatId) {
      handleNewChat();
    }
  };

  // Function to reset chat when closing
  const handleCloseChatbot = () => {
    setIsOpen(false);
    // Reset chat data only when explicitly closed
    setHasUserInteracted(false);
    setMessages([
      {
        id: 1,
        text: `Welcome ${username}! How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setInput('');
    setIsLoading(false);
    setIsTyping(false);
    setTypingText('');
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    
    // Initialize current chat if not set
    if (isOpen && !currentChatId) {
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
    }
  }, [isOpen, currentChatId]);

  // Save search to history
  const saveToSearchHistory = (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    
    const trimmedQuery = searchQuery.trim();
    const newHistoryItem = {
      id: Date.now(),
      query: trimmedQuery,
      timestamp: new Date().toISOString()
    };
    
    setSearchHistory(prev => {
      // Remove duplicates and keep only last 20 items
      const filtered = prev.filter(item => item.query.toLowerCase() !== trimmedQuery.toLowerCase());
      const updated = [newHistoryItem, ...filtered].slice(0, 20);
      
      // Save to localStorage
      try {
        localStorage.setItem('chatbotSearchHistory', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
      
      return updated;
    });
  };

  // Helper function to handle network errors
  const handleNetworkError = (error, resourceName = 'data') => {
    const errorMessage = error?.message || '';
    const errorString = error?.toString() || '';
    
    // Check for network-related errors
    if (
      errorMessage.includes('UnknownHostException') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed') ||
      errorString.includes('UnknownHostException') ||
      error?.name === 'TypeError' && errorMessage.includes('fetch')
    ) {
      return `I'm having trouble connecting to the server. Please make sure the backend is running and try again.`;
    }
    
    // Check for authentication errors
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('Session expired')
    ) {
      return `Your session has expired. Please log in again.`;
    }
    
    // Generic error
    return `I encountered an error while fetching ${resourceName}. Please try again later.`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Mark user as interacted and remove welcome message
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      setMessages(prev => prev.filter(msg => msg.id !== 1));
    }

    const messageText = input.trim();
    
    // Save to search history
    saveToSearchHistory(messageText);

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Process the message and get response
      const response = await processMessage(messageText);
      
      // Check if response contains applications array (for missing documents)
      if (response && typeof response === 'object' && response.applications && Array.isArray(response.applications)) {
        setIsLoading(false);
      const botMessage = {
        id: Date.now() + 1,
          text: response.message || 'Applications found',
        sender: 'bot',
          timestamp: new Date(),
          applications: response.applications
        };
        setMessages(prev => [...prev, botMessage]);
        setTimeout(() => scrollToBottom(), 100);
        return;
      }
      
      // Check if response contains navigation instruction - show clickable link instead of auto-navigating
      if (response && typeof response === 'object' && response.navigate) {
        const entityName = response.candidateName || response.clientName || response.jobName || response.menuItem || 'page';
      const botMessage = {
        id: Date.now() + 1,
          text: response.message || `Found: ${entityName}\n\nClick the link below to view details:`,
        sender: 'bot',
          timestamp: new Date(),
          navigate: response.navigate,
          entityName: entityName
        };
      setMessages(prev => [...prev, botMessage]);
        return;
      }
      
      const responseText = typeof response === 'string' ? response : response.message || 'Response received';
      
      // Start typing animation
      setIsTyping(true);
      setTypingText('');
      
      // Clear any existing typing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      // Animate typing
      let currentIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < responseText.length) {
          setTypingText(responseText.substring(0, currentIndex + 1));
          currentIndex++;
          scrollToBottom();
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsTyping(false);
          
          // Add message after typing completes
          const botMessage = {
            id: Date.now() + 1,
            text: responseText,
            sender: 'bot',
            timestamp: new Date()
          };
      setMessages(prev => [...prev, botMessage]);
          setTypingText('');
        }
      }, 15); // Speed of typing (15ms per character)
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Use the network error handler if processMessage throws
      const errorText = handleNetworkError(error, 'information');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processMessage = async (message) => {
    const lowerMessage = message.toLowerCase();
    const trimmedMessage = lowerMessage.trim();

    // Menu navigation detection - check for sidebar menu items first
    const menuRoutes = {
      'dashboard': '/dashboard',
      'jobs': '/jobs',
      'job': '/jobs',
      'clients': '/clients',
      'client': '/clients',
      'candidates': '/candidates',
      'candidate': '/candidates',
      'interviews': '/interviews',
      'interview': '/interviews',
      'applications': '/applications',
      'application': '/applications',
      'reports': '/reports',
      'report': '/reports',
      'user management': '/Users',
      'users': '/Users',
      'user': '/Users',
      'account manager': '/account-manager',
      'account': '/account-manager',
      'candidate email': '/candidate-emails',
      'candidate emails': '/candidate-emails',
      'website applications': '/wesiteapplication',
      'website application': '/wesiteapplication',
      'website': '/wesiteapplication'
    };

    // Check if message is a direct menu navigation request
    for (const [keyword, path] of Object.entries(menuRoutes)) {
      // Check for exact match or with "go to", "open", "show", "navigate to", etc.
      const navigationPatterns = [
        new RegExp(`^${keyword}$`, 'i'),
        new RegExp(`^(go to|open|show|navigate to|take me to|visit|view)\\s+${keyword}`, 'i'),
        new RegExp(`^${keyword}\\s+(page|section|menu|list)`, 'i')
      ];

      const matches = navigationPatterns.some(pattern => pattern.test(trimmedMessage));
      
      if (matches) {
        return {
          navigate: path,
          message: `Click the button below to navigate to ${keyword}.`,
          menuItem: keyword
        };
      }
    }

    // Date detection and candidate filtering by date
    // Check if message contains date patterns and mentions candidates
    if (lowerMessage.includes('candidate') || lowerMessage.includes('candidates')) {
      // Date patterns: DD-MM-YYYY, DD/MM/YYYY, MM-DD-YYYY, MM/DD/YYYY, YYYY-MM-DD, DD MMM YYYY, etc.
      const datePatterns = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // DD-MM-YYYY or DD/MM/YYYY
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY-MM-DD or YYYY/MM/DD
        /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,  // DD MMM YYYY
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,  // MMM DD, YYYY
      ];

      let parsedDate = null;
      let dateString = null;

      for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
          try {
            // Try to parse the date
            if (pattern === datePatterns[0]) {
              // DD-MM-YYYY or DD/MM/YYYY
              const day = parseInt(match[1]);
              const month = parseInt(match[2]);
              const year = parseInt(match[3]);
              parsedDate = new Date(year, month - 1, day);
              dateString = `${day}-${month}-${year}`;
            } else if (pattern === datePatterns[1]) {
              // YYYY-MM-DD or YYYY/MM/DD
              const year = parseInt(match[1]);
              const month = parseInt(match[2]);
              const day = parseInt(match[3]);
              parsedDate = new Date(year, month - 1, day);
              dateString = `${day}-${month}-${year}`;
            } else if (pattern === datePatterns[2]) {
              // DD MMM YYYY
              const day = parseInt(match[1]);
              const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const month = monthNames.indexOf(match[2].toLowerCase().substring(0, 3));
              const year = parseInt(match[3]);
              parsedDate = new Date(year, month, day);
              dateString = `${day}-${month + 1}-${year}`;
            } else if (pattern === datePatterns[3]) {
              // MMM DD, YYYY
              const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const month = monthNames.indexOf(match[1].toLowerCase().substring(0, 3));
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              parsedDate = new Date(year, month, day);
              dateString = `${day}-${month + 1}-${year}`;
            }

            // Validate the date
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              // Filter candidates by date
              try {
                const candidates = await candidateAPI.getAll();
                const candidatesArray = Array.isArray(candidates) ? candidates : [];
                
                // Set time to start of day for comparison
                parsedDate.setHours(0, 0, 0, 0);
                
                const filteredCandidates = candidatesArray.filter(candidate => {
                  if (!candidate.createdAt) return false;
                  const candidateDate = new Date(candidate.createdAt);
                  candidateDate.setHours(0, 0, 0, 0);
                  return candidateDate.getTime() === parsedDate.getTime();
                });

                if (filteredCandidates.length === 0) {
                  return `📅 No candidates found for date ${dateString}.\n\nPlease check the date format or try a different date.`;
                }

                let response = `📅 CANDIDATES ON ${dateString}\n\n`;
                response += `Total Candidates: ${filteredCandidates.length}\n\n`;
                response += `Candidates List:\n`;
                
                filteredCandidates.slice(0, 10).forEach((candidate, index) => {
                  response += `${index + 1}. ${candidate.name || 'Unknown'}`;
                  if (candidate.email) response += ` (${candidate.email})`;
                  if (candidate.phone) response += ` - ${candidate.phone}`;
                  response += `\n`;
                });

                if (filteredCandidates.length > 10) {
                  response += `\n... and ${filteredCandidates.length - 10} more candidates.\n`;
                }

                response += `\n🔗 Click below to view all candidates for this date.`;

                return {
                  message: response,
                  navigate: '/candidates',
                  candidates: filteredCandidates
                };
              } catch (error) {
                console.error('Error fetching candidates by date:', error);
                return `❌ Error fetching candidates for date ${dateString}. Please try again.`;
              }
            }
          } catch (error) {
            console.error('Error parsing date:', error);
          }
        }
      }
    }

    // Quick Insights for Recruiters - Professional and Concise
    if (lowerMessage.includes('new application') || lowerMessage.includes('new applications') || 
        lowerMessage.includes('recent application')) {
      try {
        const applications = await applicationAPI.getAll();
        const applicationsArray = Array.isArray(applications) ? applications : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newApps = applicationsArray.filter(app => {
          const appDate = new Date(app.appliedAt || app.createdAt);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });
        return `📊 New Applications Today: ${newApps.length}\n\n${newApps.length > 0 ? `Latest: ${newApps[0]?.candidateName || 'N/A'} → ${newApps[0]?.jobName || 'N/A'}` : 'No new applications today.'}`;
      } catch {
        return `Unable to fetch new applications. Please try again.`;
      }
    }

    // Send reminders to recruiters with pending interviews
    if ((lowerMessage.includes('send reminder') && lowerMessage.includes('recruiter')) || 
        (lowerMessage.includes('remind recruiter') && lowerMessage.includes('interview'))) {
      try {
        // Fetch all interviews
        const interviews = await interviewAPI.getAll();
        const interviewsArray = Array.isArray(interviews) ? interviews : [];
        
        // Get current date and time
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // Filter for pending/upcoming interviews (today or future)
        const pendingInterviews = interviewsArray.filter(interview => {
          if (!interview.interviewDate) return false;
          
          const interviewDate = new Date(interview.interviewDate);
          interviewDate.setHours(0, 0, 0, 0);
          
          // Include interviews scheduled for today or future dates
          if (interviewDate >= today) {
            // If it's today, check if the interview time hasn't passed
            if (interviewDate.getTime() === today.getTime() && interview.interviewTime) {
              const interviewDateTime = new Date(`${interview.interviewDate}T${interview.interviewTime}`);
              return interviewDateTime > now;
            }
            return true;
          }
          return false;
        });
        
        if (pendingInterviews.length === 0) {
          return `No pending interviews found. All scheduled interviews have either passed or there are no upcoming interviews.`;
        }
        
        // Group interviews by recruiter
        const recruiterInterviewsMap = new Map();
        
        pendingInterviews.forEach(interview => {
          // Extract recruiter information
          const recruiterId = interview.scheduledByUserId || 
                             interview.scheduledBy?.id || 
                             interview.scheduledBy?.userId;
          const recruiterName = interview.scheduledByName || 
                               interview.scheduledBy?.username || 
                               interview.scheduledBy?.name || 
                               'Unknown Recruiter';
          const recruiterEmail = interview.scheduledByEmail || 
                               interview.scheduledBy?.email;
          
          if (recruiterId || recruiterName !== 'Unknown Recruiter') {
            const key = recruiterId || recruiterName;
            if (!recruiterInterviewsMap.has(key)) {
              recruiterInterviewsMap.set(key, {
                recruiterId,
                recruiterName,
                recruiterEmail,
                interviews: []
              });
            }
            recruiterInterviewsMap.get(key).interviews.push(interview);
          }
        });
        
        if (recruiterInterviewsMap.size === 0) {
          return `Found ${pendingInterviews.length} pending interview${pendingInterviews.length !== 1 ? 's' : ''}, but unable to identify recruiters.`;
        }
        
        // Create notifications for each recruiter
        let notificationsCreated = 0;
        const errors = [];
        
        for (const [, recruiterData] of recruiterInterviewsMap.entries()) {
          try {
            const interviewCount = recruiterData.interviews.length;
            const candidateNames = recruiterData.interviews
              .map(i => i.candidateName || i.candidate?.name || i.application?.candidate?.name || 'Unknown')
              .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
              .slice(0, 5)
              .join(', ');
            
            const title = `Pending Interview${interviewCount !== 1 ? 's' : ''} Reminder`;
            const message = `You have ${interviewCount} pending interview${interviewCount !== 1 ? 's' : ''} scheduled. ${candidateNames ? `Candidates: ${candidateNames}${recruiterData.interviews.length > 5 ? ' and more...' : ''}` : 'Please check your interview schedule.'}`;
            
            // Create notification for the recruiter
            await notificationAPI.create({
              title,
              message,
              type: 'INTERVIEW_REMINDER',
              relatedEntityId: recruiterData.recruiterId,
              relatedEntityType: 'RECRUITER'
            });
            
            notificationsCreated++;
          } catch (error) {
            console.error(`Error creating notification for recruiter ${recruiterData.recruiterName}:`, error);
            errors.push(recruiterData.recruiterName);
          }
        }
        
        if (notificationsCreated === 0) {
          return `Failed to send reminders to recruiters. Please try again or contact support.`;
        }
        
        const errorMsg = errors.length > 0 ? `\n\nNote: Failed to send reminders to ${errors.length} recruiter${errors.length !== 1 ? 's' : ''}: ${errors.join(', ')}` : '';
        return `✅ Successfully sent reminders to ${notificationsCreated} recruiter${notificationsCreated !== 1 ? 's' : ''} with pending interviews.\n\nTotal pending interviews: ${pendingInterviews.length}${errorMsg}`;
      } catch (error) {
        console.error('Error sending reminders to recruiters:', error);
        return `Unable to send reminders to recruiters. Please try again.`;
      }
    }

    // Send reminders to candidates with pending interviews
    if (lowerMessage.includes('send reminder') || lowerMessage.includes('remind candidate') || 
        (lowerMessage.includes('reminder') && lowerMessage.includes('interview'))) {
      try {
        // Fetch all interviews
        const interviews = await interviewAPI.getAll();
        const interviewsArray = Array.isArray(interviews) ? interviews : [];
        
        // Get current date and time
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // Filter for pending/upcoming interviews (today or future)
        const pendingInterviews = interviewsArray.filter(interview => {
          if (!interview.interviewDate) return false;
          
          const interviewDate = new Date(interview.interviewDate);
          interviewDate.setHours(0, 0, 0, 0);
          
          // Include interviews scheduled for today or future dates
          if (interviewDate >= today) {
            // If it's today, check if the interview time hasn't passed
            if (interviewDate.getTime() === today.getTime() && interview.interviewTime) {
              const interviewDateTime = new Date(`${interview.interviewDate}T${interview.interviewTime}`);
              return interviewDateTime > now;
            }
            return true;
          }
          return false;
        });
        
        if (pendingInterviews.length === 0) {
          return `No pending interviews found. All scheduled interviews have either passed or there are no upcoming interviews.`;
        }
        
        // Extract unique candidate IDs from pending interviews
        const candidateIds = [...new Set(pendingInterviews
          .map(interview => {
            // Try multiple possible structures
            return interview.candidateId || 
                   interview.candidate?.id || 
                   interview.application?.candidate?.id ||
                   interview.application?.candidateId;
          })
          .filter(id => id != null))];
        
        if (candidateIds.length === 0) {
          return `Found ${pendingInterviews.length} pending interview${pendingInterviews.length !== 1 ? 's' : ''}, but unable to identify candidate IDs.`;
        }
        
        // Send reminders via email
        const reminderMessage = `This is a reminder about your upcoming interview. Please check your interview details and be prepared.`;
        
        try {
          await candidateEmailAPI.sendBulkEmails(candidateIds, '', reminderMessage);
          return `✅ Successfully sent reminders to ${candidateIds.length} candidate${candidateIds.length !== 1 ? 's' : ''} with pending interviews.\n\nTotal pending interviews: ${pendingInterviews.length}`;
        } catch (emailError) {
          console.error('Error sending reminder emails:', emailError);
          return `Found ${pendingInterviews.length} pending interview${pendingInterviews.length !== 1 ? 's' : ''} for ${candidateIds.length} candidate${candidateIds.length !== 1 ? 's' : ''}, but failed to send reminder emails. Please try again or contact support.`;
        }
      } catch (error) {
        console.error('Error fetching pending interviews:', error);
        return `Unable to fetch pending interviews. Please try again.`;
      }
    }

    if (lowerMessage.includes('pending follow') || lowerMessage.includes('follow-up') || 
        lowerMessage.includes('pending action') || lowerMessage.includes('action required')) {
      try {
        const applications = await applicationAPI.getAll();
        const applicationsArray = Array.isArray(applications) ? applications : [];
        const pending = applicationsArray.filter(app => {
          const status = (app.status || '').toUpperCase();
          return status.includes('PENDING') || status.includes('FEEDBACK_PENDING');
        });
        return `📋 Pending Actions: ${pending.length} application${pending.length !== 1 ? 's' : ''} require${pending.length !== 1 ? '' : 's'} follow-up.\n\n${pending.length > 0 ? `Status: ${pending.slice(0, 3).map(a => a.status).join(', ')}` : 'All actions are up to date.'}`;
      } catch {
        return `Unable to fetch pending actions. Please try again.`;
      }
    }

    // Check for recruiter-specific candidate count queries (MUST be checked early, before candidate name search)
    // Handle recruiter activity summary - search by recruiter name to see today's activities
    // Pattern: Just a name, or "recruiter [name]", or "[name] today", or "what did [name] do"
    const recruiterActivityPatterns = [
      /^(?:recruiter\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:today|activity|activities|summary|work|did)?$/i,
      /^(?:what\s+did|show|find|search)\s+(?:recruiter\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:do|today|activity|activities)?$/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:today|activity|activities|summary|work|did)$/i
    ];
    
    let recruiterNameForActivity = null;
    for (const pattern of recruiterActivityPatterns) {
      const match = trimmedMessage.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        // Exclude common words that might be captured
        if (extractedName.length >= 2 && 
            !['Today', 'Yesterday', 'Show', 'Find', 'Search', 'What', 'Did', 'Do', 'Activity', 'Activities', 'Summary', 'Work'].includes(extractedName)) {
          recruiterNameForActivity = extractedName;
          break;
        }
      }
    }
    
    // Also check if message contains a recruiter name without specific query patterns
    // This catches queries like "John", "recruiter John", "John's activity"
    if (!recruiterNameForActivity && !lowerMessage.includes('candidate') && !lowerMessage.includes('added') && !lowerMessage.includes('created')) {
      const words = trimmedMessage.split(/\s+/);
      // Look for capitalized words (likely names)
      const capitalizedWords = words.filter(w => /^[A-Z][a-z]+$/.test(w) && 
        !['Today', 'Yesterday', 'Show', 'Find', 'Search', 'What', 'Did', 'Do', 'Activity', 'Activities', 'Summary', 'Work', 'Recruiter', 'User', 'By'].includes(w));
      
      if (capitalizedWords.length > 0 && capitalizedWords.length <= 3) {
        recruiterNameForActivity = capitalizedWords.join(' ');
      }
    }
    
    // If we found a recruiter name and it's not a specific candidate query, show activity summary
    if (recruiterNameForActivity && !lowerMessage.includes('candidate') && !lowerMessage.includes('added') && !lowerMessage.includes('created')) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        // Fetch all data
        const [candidates, interviews, applications] = await Promise.all([
          candidateAPI.getAll().catch(() => []),
          interviewAPI.getAll().catch(() => []),
          applicationAPI.getAll().catch(() => [])
        ]);
        
        const candidatesArray = Array.isArray(candidates) ? candidates : [];
        const interviewsArray = Array.isArray(interviews) ? interviews : [];
        const applicationsArray = Array.isArray(applications) ? applications : [];
        
        // Helper to match recruiter name for candidates and applications
        const matchesRecruiter = (item) => {
          const recruiterLower = recruiterNameForActivity.toLowerCase().trim();
          const createdByUsername = (item.createdByUsername || item.createdByName || '').toLowerCase().trim();
          const createdByName = (item.createdByName || item.createdByUsername || '').toLowerCase().trim();
          const createdByEmail = (item.createdByEmail || '').toLowerCase().trim();
          
          return createdByUsername === recruiterLower ||
                 createdByName === recruiterLower ||
                 createdByUsername.includes(recruiterLower) || 
                 createdByName.includes(recruiterLower) || 
                 createdByEmail.includes(recruiterLower);
        };
        
        // Helper to check if date is today
        const isToday = (date) => {
          if (!date) return false;
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        };
        
        // Filter today's activities
        const todayCandidates = candidatesArray.filter(c => matchesRecruiter(c) && isToday(c.createdAt));
        
        // For interviews, match by checking if the candidate or application was created by this recruiter
        // Since InterviewDTO doesn't have scheduledBy, we match by associated candidate/application
        const todayInterviews = interviewsArray.filter(i => {
          // Check if interview is today
          if (!isToday(i.interviewDate)) return false;
          
          // Try to match by checking if the candidate was added by this recruiter
          const candidate = candidatesArray.find(c => c.id === i.candidateId);
          if (candidate && matchesRecruiter(candidate)) {
            return true;
          }
          
          // Also check if application was created by this recruiter
          // Match by candidate name and job title
          const application = applicationsArray.find(a => {
            const candidateMatch = a.candidate && a.candidate.id === i.candidateId;
            const jobMatch = a.job && a.job.jobName === i.jobTitle;
            return candidateMatch || (a.candidateName === i.candidateName && jobMatch);
          });
          
          if (application && matchesRecruiter(application)) {
            return true;
          }
          
          return false;
        });
        
        // Filter applications - check appliedAt or createdAt
        const todayApplications = applicationsArray.filter(a => {
          const matches = matchesRecruiter(a);
          if (!matches) return false;
          // Check both appliedAt and createdAt (if available)
          return isToday(a.appliedAt || a.createdAt);
        });
        
        // Build summary message
        let summaryMessage = `📊 TODAY'S ACTIVITY SUMMARY FOR: ${recruiterNameForActivity}\n\n`;
        summaryMessage += `📅 Date: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
        
        summaryMessage += `👥 Candidates Added: ${todayCandidates.length}\n`;
        summaryMessage += `📋 Interviews Scheduled: ${todayInterviews.length}\n`;
        summaryMessage += `📝 Applications Created: ${todayApplications.length}\n\n`;
        
        const totalActivities = todayCandidates.length + todayInterviews.length + todayApplications.length;
        
        if (totalActivities === 0) {
          summaryMessage += `No activities recorded for ${recruiterNameForActivity} today.`;
          return summaryMessage;
        }
        
        summaryMessage += `Total Activities: ${totalActivities}\n\n`;
        summaryMessage += `Click on any item below to view details:`;
        
        // Build clickable items array
        const clickableItems = [];
        
        // Add candidates
        todayCandidates.slice(0, 10).forEach(candidate => {
          clickableItems.push({
            id: candidate.id,
            name: candidate.name || 'Unknown',
            type: 'candidate',
            navigate: `/candidates/${candidate.id}`,
            displayText: `👤 ${candidate.name || 'Unknown'} (Candidate)`
          });
        });
        
        // Add interviews
        todayInterviews.slice(0, 10).forEach(interview => {
          clickableItems.push({
            id: interview.id,
            name: interview.candidateName || 'Interview',
            type: 'interview',
            navigate: `/interviews/${interview.id}`,
            displayText: `📅 ${interview.candidateName || 'Interview'} - ${interview.jobTitle || 'Job'} (Interview)`
          });
        });
        
        // Add applications
        todayApplications.slice(0, 10).forEach(application => {
          const jobName = application.job ? application.job.jobName : (application.jobName || 'Job');
          clickableItems.push({
            id: application.id,
            name: application.candidateName || 'Application',
            type: 'application',
            navigate: `/applications/${application.id}`,
            displayText: `📝 ${application.candidateName || 'Application'} - ${jobName} (Application)`
          });
        });
        
        return {
          message: summaryMessage,
          applications: clickableItems
        };
      } catch (error) {
        console.error('Error fetching recruiter activity:', error);
        return `❌ Error fetching activity summary for "${recruiterNameForActivity}".\n\n${handleNetworkError(error, 'recruiter activity search')}`;
      }
    }
    
    // Check if this is a recruiter query (must have "candidate" and "added/created" and "by/recruiter")
    const isRecruiterQuery = (lowerMessage.includes('candidate') && 
                              (lowerMessage.includes('added') || lowerMessage.includes('created')) && 
                              (lowerMessage.includes('by') || lowerMessage.includes('recruiter') || lowerMessage.includes('user')));
    
    if (isRecruiterQuery) {
      try {
        let recruiterName = '';
        
        // Detect time filters
        const timeFilters = {
          today: lowerMessage.includes('today'),
          yesterday: lowerMessage.includes('yesterday'),
          lastWeek: lowerMessage.includes('last week') || lowerMessage.includes('past week'),
          lastMonth: lowerMessage.includes('last month') || lowerMessage.includes('past month'),
          thisWeek: lowerMessage.includes('this week'),
          thisMonth: lowerMessage.includes('this month')
        };
        
        // Pattern 1: "by recruiter [name]" - most specific and common
        const recruiterPattern1 = /by\s+recruiter\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|last\s+week|last\s+month|this\s+week|this\s+month)|$)/i;
        const match1 = trimmedMessage.match(recruiterPattern1);
        if (match1 && match1[1]) {
          recruiterName = match1[1].trim();
        }
        
        // Pattern 2: "recruiter [name]" (without "by")
        if (!recruiterName) {
          const recruiterPattern2 = /recruiter\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|last\s+week|last\s+month|this\s+week|this\s+month)|$)/i;
          const match2 = trimmedMessage.match(recruiterPattern2);
          if (match2 && match2[1]) {
            recruiterName = match2[1].trim();
          }
        }
        
        // Pattern 3: "by [name]" after "added" or "created"
        if (!recruiterName) {
          const recruiterPattern3 = /(?:added|created).*by\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|last\s+week|last\s+month|this\s+week|this\s+month)|$)/i;
          const match3 = trimmedMessage.match(recruiterPattern3);
          if (match3 && match3[1]) {
            recruiterName = match3[1].trim();
          }
        }
        
        // Pattern 4: Fallback - extract capitalized word after "by" or "recruiter"
        if (!recruiterName) {
          const words = trimmedMessage.split(/\s+/);
          const byIndex = words.findIndex(w => w.toLowerCase() === 'by');
          const recruiterIndex = words.findIndex(w => w.toLowerCase() === 'recruiter');
          const targetIndex = recruiterIndex !== -1 ? recruiterIndex + 1 : (byIndex !== -1 ? byIndex + 1 : -1);
          
          if (targetIndex !== -1 && targetIndex < words.length) {
            const nextWord = words[targetIndex];
            // Check if it's a capitalized word (likely a name) and not a time filter
            if (/^[A-Z][a-z]*$/.test(nextWord) && !['Today', 'Yesterday', 'Last', 'This', 'Week', 'Month'].includes(nextWord)) {
              recruiterName = nextWord;
            }
          }
        }
        
        // Clean up recruiter name (remove common words that might be captured)
        if (recruiterName) {
          recruiterName = recruiterName.replace(/\b(recruiter|user|by|today|yesterday|last|week|month|this|added|created|candidate|how|many|count|number|of|total|were|past)\b/gi, '').trim();
        }
        
        if (!recruiterName || recruiterName.length < 2) {
          return `Please specify the recruiter name. Example: "How many candidates were added by Admin today?" or "Candidates added by recruiter Admin"`;
        }
        
        // Fetch all candidates
        const candidates = await candidateAPI.getAll();
        const candidatesArray = Array.isArray(candidates) ? candidates : [];
        
        // Helper function to check if date is within time range
        const isDateInRange = (date, filterType) => {
          if (!date) return false;
          const candidateDate = new Date(date);
          candidateDate.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          if (filterType === 'today') {
            return candidateDate.getTime() === now.getTime();
          } else if (filterType === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return candidateDate.getTime() === yesterday.getTime();
          } else if (filterType === 'thisWeek') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            return candidateDate >= weekStart && candidateDate <= now;
          } else if (filterType === 'lastWeek') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() - 7); // Start of last week
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - now.getDay() - 1); // End of last week
            return candidateDate >= weekStart && candidateDate <= weekEnd;
          } else if (filterType === 'thisMonth') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return candidateDate >= monthStart && candidateDate <= now;
          } else if (filterType === 'lastMonth') {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return candidateDate >= lastMonthStart && candidateDate <= lastMonthEnd;
          }
          return true; // No filter
        };
        
        // Determine which time filter to use
        let activeTimeFilter = null;
        if (timeFilters.today) activeTimeFilter = 'today';
        else if (timeFilters.yesterday) activeTimeFilter = 'yesterday';
        else if (timeFilters.thisWeek) activeTimeFilter = 'thisWeek';
        else if (timeFilters.lastWeek) activeTimeFilter = 'lastWeek';
        else if (timeFilters.thisMonth) activeTimeFilter = 'thisMonth';
        else if (timeFilters.lastMonth) activeTimeFilter = 'lastMonth';
        
        // Filter candidates by recruiter and time
        let recruiterCandidates = candidatesArray.filter(candidate => {
          // Check if created by the specified recruiter (case-insensitive, exact match preferred)
          const recruiterLower = recruiterName.toLowerCase().trim();
          const createdByUsername = (candidate.createdByUsername || '').toLowerCase().trim();
          const createdByName = (candidate.createdByName || '').toLowerCase().trim();
          const createdByEmail = (candidate.createdByEmail || '').toLowerCase().trim();
          
          // Try exact match first, then partial match
          const matchesRecruiter = createdByUsername === recruiterLower ||
                                   createdByName === recruiterLower ||
                                   createdByUsername.includes(recruiterLower) || 
                                   createdByName.includes(recruiterLower) || 
                                   createdByEmail.includes(recruiterLower);
          
          if (!matchesRecruiter) return false;
          
          // Apply time filter if specified
          if (activeTimeFilter) {
            return isDateInRange(candidate.createdAt, activeTimeFilter);
          }
          
          return true;
        });
        
        const count = recruiterCandidates.length;
        const timeFilterText = activeTimeFilter ? 
          (activeTimeFilter === 'today' ? ' today' : 
           activeTimeFilter === 'yesterday' ? ' yesterday' :
           activeTimeFilter === 'thisWeek' ? ' this week' :
           activeTimeFilter === 'lastWeek' ? ' last week' :
           activeTimeFilter === 'thisMonth' ? ' this month' :
           activeTimeFilter === 'lastMonth' ? ' last month' : '') : '';
        
        if (count === 0) {
          return `No candidates were added by "${recruiterName}"${timeFilterText}.`;
        }
        
        // Return object with candidates list for navigation
        return {
          message: `${count} candidate${count !== 1 ? 's were' : ' was'} added by "${recruiterName}"${timeFilterText}.\n\nClick on any candidate below to view details:`,
          applications: recruiterCandidates.slice(0, 20).map(candidate => ({
            id: candidate.id,
            name: candidate.name || 'Unknown',
            type: 'candidate',
            navigate: `/candidates/${candidate.id}`,
            displayText: `${candidate.name || 'Unknown'}`
          }))
        };
      } catch (error) {
        console.error('Error fetching recruiter candidates:', error);
        return `Unable to fetch candidate count. Please try again.`;
      }
    }

    if (lowerMessage.includes('missing document') || lowerMessage.includes('missing resume') || 
        lowerMessage.includes('no resume') || lowerMessage.includes('document missing')) {
      try {
        // Fetch only candidates
        const candidates = await candidateAPI.getAll();
        const candidatesArray = Array.isArray(candidates) ? candidates : [];
        
        // Filter candidates without resumes
        const missingCandidateResume = candidatesArray.filter(candidate => {
          return !candidate.resumePath && !candidate.resumeUrl;
        });
        
        if (missingCandidateResume.length === 0) {
          return `All candidates have resumes attached.`;
        }
        
        // Return object with candidates array for navigation
        return {
          message: `📄 Missing Documents: ${missingCandidateResume.length} candidate${missingCandidateResume.length !== 1 ? 's' : ''} ${missingCandidateResume.length !== 1 ? 'have' : 'has'} no resume.\n\nClick on any candidate below to view details:`,
          applications: missingCandidateResume.slice(0, 15).map(candidate => ({
            id: candidate.id,
            name: candidate.name || 'Unknown',
            type: 'candidate',
            navigate: `/candidates/${candidate.id}`,
            displayText: `${candidate.name || 'Unknown'} (Candidate)`
          }))
        };
      } catch {
        return `Unable to check documents. Please try again.`;
      }
    }

    if (lowerMessage.includes('today interview') || lowerMessage.includes('interview today') || 
        lowerMessage.includes('schedule today') || lowerMessage.includes('upcoming interview')) {
      try {
        const interviews = await interviewAPI.getAll();
        const interviewsArray = Array.isArray(interviews) ? interviews : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayInterviews = interviewsArray.filter(interview => {
          const interviewDate = new Date(interview.interviewDate);
          interviewDate.setHours(0, 0, 0, 0);
          return interviewDate.getTime() === today.getTime();
        });
        return `📅 Interviews Today: ${todayInterviews.length}\n\n${todayInterviews.length > 0 ? todayInterviews.slice(0, 3).map(i => `• ${i.candidateName || 'N/A'} at ${i.interviewTime || 'N/A'}`).join('\n') : 'No interviews scheduled today.'}`;
      } catch {
        return `Unable to fetch interview schedule. Please try again.`;
      }
    }

    if (lowerMessage.includes('candidate summary') || (lowerMessage.includes('summary') && 
        (lowerMessage.includes('candidate') || lowerMessage.includes('all candidate')))) {
      try {
        const candidates = await candidateAPI.getAll();
        const candidatesArray = Array.isArray(candidates) ? candidates : [];
        const byStatus = {};
        candidatesArray.forEach(c => {
          const status = c.status || 'UNKNOWN';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        let summary = `👥 Candidate Summary:\n\nTotal: ${candidatesArray.length}\n`;
        Object.entries(byStatus).slice(0, 5).forEach(([status, count]) => {
          summary += `${status}: ${count}\n`;
        });
        return summary;
      } catch {
        return `Unable to generate candidate summary. Please try again.`;
      }
    }

    // Check for feature-related queries
    if (lowerMessage.includes('features') || lowerMessage.includes('ats features') || 
        lowerMessage.includes('what features') || lowerMessage.includes('show features') ||
        lowerMessage.includes('list features') || lowerMessage.includes('all features')) {
      // This will be handled by the help section below
    }

    // Question pattern detection
    const isQuestion = trimmedMessage.endsWith('?') || 
                       trimmedMessage.startsWith('what') ||
                       trimmedMessage.startsWith('who') ||
                       trimmedMessage.startsWith('when') ||
                       trimmedMessage.startsWith('where') ||
                       trimmedMessage.startsWith('why') ||
                       trimmedMessage.startsWith('how') ||
                       trimmedMessage.startsWith('which') ||
                       trimmedMessage.startsWith('can you') ||
                       trimmedMessage.startsWith('could you') ||
                       trimmedMessage.startsWith('tell me');

    // Check for candidate status queries first (before name detection)
    const statusMap = {
      'pending': 'PENDING',
      'scheduled': 'SCHEDULED',
      'interviewed': 'INTERVIEWED',
      'placed': 'PLACED',
      'rejected': 'REJECTED',
      'not interested': 'NOT_INTERESTED',
      'hold': 'HOLD',
      'high ctc': 'HIGH_CTC',
      'dropped by client': 'DROPPED_BY_CLIENT',
      'submitted to client': 'SUBMITTED_TO_CLIENT',
      'no response': 'NO_RESPONSE',
      'immediate': 'IMMEDIATE',
      'rejected by client': 'REJECTED_BY_CLIENT',
      'client shortlist': 'CLIENT_SHORTLIST',
      'first interview scheduled': 'FIRST_INTERVIEW_SCHEDULED',
      'first interview feedback pending': 'FIRST_INTERVIEW_FEEDBACK_PENDING',
      'first interview reject': 'FIRST_INTERVIEW_REJECT',
      'second interview scheduled': 'SECOND_INTERVIEW_SCHEDULED',
      'second interview feedback pending': 'SECOND_INTERVIEW_FEEDBACK_PENDING',
      'second interview reject': 'SECOND_INTERVIEW_REJECT',
      'third interview scheduled': 'THIRD_INTERVIEW_SCHEDULED',
      'third interview feedback pending': 'THIRD_INTERVIEW_FEEDBACK_PENDING',
      'third interview reject': 'THIRD_INTERVIEW_REJECT',
      'internal reject': 'INTERNEL_REJECT',
      'client reject': 'CLIENT_REJECT',
      'final select': 'FINAL_SELECT',
      'joined': 'JOINED',
      'backedout': 'BACKEDOUT',
      'not relevant': 'NOT_RELEVANT',
      'new candidate': 'NEW_CANDIDATE',
      'new': 'NEW_CANDIDATE'
    };

    // Check if message is just a status (without "candidate" keyword)
    let detectedStatus = null;
    let statusDisplayName = null;
    
    // Check for status in various formats - improved to catch all variations
    for (const [key, value] of Object.entries(statusMap)) {
      // Exact matches
      if (lowerMessage === key || lowerMessage === value.toLowerCase() || 
          lowerMessage === `candidates ${key}` || lowerMessage === `${key} candidates` ||
          lowerMessage === `show ${key}` || lowerMessage === `list ${key}` ||
          lowerMessage === `find ${key}` || lowerMessage === `search ${key}` ||
          lowerMessage === `${key} status` || lowerMessage === `status ${key}` ||
          lowerMessage === `candidates with ${key}` || lowerMessage === `${key} candidate`) {
        detectedStatus = value;
        statusDisplayName = key.charAt(0).toUpperCase() + key.slice(1);
        break;
      }
      
      // Partial matches (status keyword appears in message)
      // Also catch single-word status queries (e.g., "pending", "scheduled")
      if (!detectedStatus && lowerMessage.includes(key) && 
          (lowerMessage.includes('candidate') || lowerMessage.includes('status') || 
           lowerMessage.includes('show') || lowerMessage.includes('list') || 
           lowerMessage.includes('find') || lowerMessage.includes('search') ||
           words.length <= 3 || trimmedMessage === key)) {
        detectedStatus = value;
        statusDisplayName = key.charAt(0).toUpperCase() + key.slice(1);
        break;
      }
    }
    
    // Also check for direct status mentions (uppercase with underscores)
    if (!detectedStatus) {
      const statusPattern = /^(PENDING|SCHEDULED|REJECTED|PLACED|HOLD|NEW_CANDIDATE|INTERVIEWED|NOT_INTERESTED|HIGH_CTC|DROPPED_BY_CLIENT|SUBMITTED_TO_CLIENT|NO_RESPONSE|IMMEDIATE|REJECTED_BY_CLIENT|CLIENT_SHORTLIST|FIRST_INTERVIEW_SCHEDULED|FIRST_INTERVIEW_FEEDBACK_PENDING|FIRST_INTERVIEW_REJECT|SECOND_INTERVIEW_SCHEDULED|SECOND_INTERVIEW_FEEDBACK_PENDING|SECOND_INTERVIEW_REJECT|THIRD_INTERVIEW_SCHEDULED|THIRD_INTERVIEW_FEEDBACK_PENDING|THIRD_INTERVIEW_REJECT|INTERNEL_REJECT|CLIENT_REJECT|FINAL_SELECT|JOINED|BACKEDOUT|NOT_RELEVANT)$/i;
      const statusMatch = trimmedMessage.match(statusPattern);
      if (statusMatch) {
        detectedStatus = statusMatch[1].toUpperCase();
        statusDisplayName = detectedStatus.replace(/_/g, ' ').toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // If status detected, fetch and display candidates with clickable links
    if (detectedStatus) {
      try {
        const candidatesByStatus = await candidateAPI.getByStatus(detectedStatus);
        const candidatesArray = Array.isArray(candidatesByStatus) ? candidatesByStatus : [];
        
        if (candidatesArray.length === 0) {
          return `❌ No candidates found with status "${statusDisplayName || detectedStatus}".\n\nYou can try:\n• Type "list candidates" to see all candidates\n• Type "help" to see available statuses`;
        }
        
        // Format status for display
        const formatStatus = (status) => {
          if (!status) return 'N/A';
          return status.toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        // Return object with candidates array for clickable navigation
        return {
          message: `📋 CANDIDATES WITH STATUS: ${statusDisplayName || formatStatus(detectedStatus)}\n\nTotal Count: ${candidatesArray.length} candidate${candidatesArray.length !== 1 ? 's' : ''}\n\nClick on any candidate below to view details:`,
          applications: candidatesArray.slice(0, 20).map(candidate => ({
            id: candidate.id,
            name: candidate.name || 'Unknown',
            type: 'candidate',
            navigate: `/candidates/${candidate.id}`,
            displayText: `${candidate.name || 'Unknown'} - ${formatStatus(candidate.status)}`
          }))
        };
      } catch (error) {
        console.error('Error fetching candidates by status:', error);
        return `❌ Error fetching candidates with status "${statusDisplayName || detectedStatus}".\n\n${handleNetworkError(error, 'candidate status search')}`;
      }
    }

    // Smart client name detection - if message looks like a company/client name, search for client
    // Check if message contains client-related keywords or looks like a company name
    const clientKeywords = ['client', 'company', 'organization', 'firm', 'corp', 'inc', 'ltd', 'llc'];
    const hasClientKeyword = clientKeywords.some(keyword => lowerMessage.includes(keyword));
    const words = trimmedMessage.split(/\s+/);
    const commonCommands = ['show', 'find', 'search', 'list', 'get', 'tell', 'about', 'details', 'info', 
                           'candidate', 'applicant', 'job', 'application', 'interview', 'help', 'how', 
                           'what', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'the', 'a', 'an'];
    
    // Check if user wants to navigate to clients page
    if ((lowerMessage.includes('list clients') || lowerMessage.includes('show clients') || 
         lowerMessage.includes('all clients') || lowerMessage === 'clients') &&
        !lowerMessage.includes('candidate') && !lowerMessage.includes('applicant')) {
      return {
        navigate: '/clients',
        message: `Click the button below to navigate to Clients page.`,
        menuItem: 'clients'
      };
    }
    
    // Check if it's a client search query
    const isClientQuery = hasClientKeyword || 
                         (lowerMessage.includes('client') && words.length <= 4) ||
                         (lowerMessage.includes('company') && words.length <= 4);
    
    // Extract client name from query if it contains client keywords
    if (isClientQuery && !lowerMessage.includes('candidate') && !lowerMessage.includes('applicant')) {
      try {
        // Extract potential client name
        let clientName = trimmedMessage;
        
        // Remove common client-related words to get the actual name
        clientKeywords.forEach(keyword => {
          clientName = clientName.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
        });
        ['show', 'find', 'search', 'list', 'get', 'tell', 'about', 'details', 'info'].forEach(cmd => {
          clientName = clientName.replace(new RegExp(`\\b${cmd}\\b`, 'gi'), '').trim();
        });
        
        // If we have a name after cleaning, search for client
        if (clientName.length > 1) {
          const searchResults = await clientAPI.search(clientName);
          const searchArray = Array.isArray(searchResults) ? searchResults : [];
          
          if (searchArray.length > 0) {
            const client = searchArray[0];
            return {
              navigate: `/clients/${client.id}`,
              message: `Found client: ${client.clientName || clientName}\n\nClick the button below to view client details.`,
              clientName: client.clientName || clientName
            };
          } else {
            return `❌ No client found with the name "${clientName}".\n\nPlease check the spelling or try searching with a different name. You can also:\n• Type "list clients" to see all clients\n• Type "help" to see what I can do`;
          }
        }
      } catch (error) {
        console.error('Error searching for client:', error);
        // Continue with normal processing if search fails
      }
    }

    // Smart name detection - try job first, then client, then candidate
    // Check if it's a simple name/term that could be job, client, or candidate
    const isSimpleName = words.length >= 1 && 
                        words.length <= 4 && 
                        words.every(word => word.length > 1) &&
                        !words.some(word => commonCommands.includes(word.toLowerCase())) &&
                        !trimmedMessage.includes('?') &&
                        !trimmedMessage.match(/^\d+$/) && // Not just numbers
                        !lowerMessage.includes('application') && 
                        !lowerMessage.includes('interview') &&
                        !lowerMessage.includes('help') &&
                        !lowerMessage.includes('feature');

    // If it's a simple name without keywords, try job first, then client, then candidate
    if (isSimpleName && 
        !lowerMessage.includes('candidate') && 
        !lowerMessage.includes('applicant') &&
        !lowerMessage.includes('client') &&
        !lowerMessage.includes('company')) {
      try {
        const searchName = trimmedMessage;
        
        // Try job search first
        try {
          const jobResults = await jobAPI.search(searchName);
          const jobArray = Array.isArray(jobResults) ? jobResults : [];
          
          if (jobArray.length > 0) {
            const job = jobArray[0];
            return {
              navigate: `/jobs/${job.id}`,
              message: `Found job: ${job.jobName || searchName}\n\nClick the button below to view job details.`,
              jobName: job.jobName || searchName
            };
          }
        } catch (jobError) {
          console.error('Error searching for job:', jobError);
        }
        
        // If no job found, try client search
        try {
          const clientResults = await clientAPI.search(searchName);
          const clientArray = Array.isArray(clientResults) ? clientResults : [];
          
          if (clientArray.length > 0) {
            const client = clientArray[0];
            return {
              navigate: `/clients/${client.id}`,
              message: `Found client: ${client.clientName || searchName}\n\nClick the button below to view client details.`,
              clientName: client.clientName || searchName
            };
          }
        } catch (clientError) {
          console.error('Error searching for client:', clientError);
        }
        
        // If no job or client found, try candidate search
        const candidateResults = await candidateAPI.search(searchName);
        const candidateArray = Array.isArray(candidateResults) ? candidateResults : [];
        
        if (candidateArray.length > 0) {
          const candidate = candidateArray[0];
          return {
            navigate: `/candidates/${candidate.id}`,
            message: `Found candidate: ${candidate.name || searchName}\n\nClick the button below to view candidate details.`,
            candidateName: candidate.name || searchName
          };
        }
        
        // If none found, show helpful error message
        return `❌ No job, client, or candidate found with the name "${searchName}".\n\nPlease check the spelling or try searching with a different name. You can also:\n• Type "list jobs" to see all jobs\n• Type "list clients" to see all clients\n• Type "list candidates" to see all candidates\n• Type "help" to see what I can do`;
        
      } catch (error) {
        console.error('Error searching:', error);
        return `❌ Error searching for "${trimmedMessage}".\n\n${handleNetworkError(error, 'search')}\n\nPlease try again or type "help" for assistance.`;
      }
    }

    // Job Matching Feature - Find jobs based on skills, experience, and location
    const jobMatchingKeywords = ['match', 'find job', 'job for', 'jobs for', 'suitable job', 'best job', 
                                  'recommend job', 'job match', 'find me job', 'looking for job', 
                                  'search job', 'job search', 'available job', 'job available'];
    
    const isJobMatchingQuery = jobMatchingKeywords.some(keyword => lowerMessage.includes(keyword)) ||
                               (lowerMessage.includes('job') && (lowerMessage.includes('skill') || 
                                                                  lowerMessage.includes('experience') || 
                                                                  lowerMessage.includes('location') ||
                                                                  lowerMessage.includes('i have') ||
                                                                  lowerMessage.includes('i am') ||
                                                                  lowerMessage.includes('my skill') ||
                                                                  lowerMessage.includes('my experience')));
    
    if (isJobMatchingQuery) {
      try {
        // Extract skills, experience, and location from message
        const extractSkills = (msg) => {
          const skillKeywords = ['skill', 'know', 'expert', 'proficient', 'experience with', 'worked with'];
          const skills = [];
          
          // Common tech skills patterns
          const techSkills = ['java', 'python', 'javascript', 'react', 'angular', 'vue', 'node', 'spring',
                            'sql', 'mysql', 'postgresql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
                            'html', 'css', 'typescript', 'php', 'ruby', 'go', 'c++', 'c#', '.net',
                            'machine learning', 'ai', 'data science', 'devops', 'ci/cd', 'git',
                            'agile', 'scrum', 'rest api', 'graphql', 'microservices'];
          
          // Look for skills mentioned in the message
          techSkills.forEach(skill => {
            if (msg.toLowerCase().includes(skill.toLowerCase())) {
              skills.push(skill);
            }
          });
          
          // Extract skills after keywords like "skills:", "know:", etc.
          const skillPatterns = [
            /(?:skill|know|expert|proficient|experience with|worked with)[\s:]+([^,.\n]+)/gi,
            /(?:i have|i know|i am|i'm)[\s]+(?:experience with|skills in|knowledge of)[\s]+([^,.\n]+)/gi
          ];
          
          skillPatterns.forEach(pattern => {
            const matches = msg.matchAll(pattern);
            for (const match of matches) {
              const extracted = match[1]?.trim();
              if (extracted && extracted.length > 2) {
                skills.push(extracted);
              }
            }
          });
          
          return [...new Set(skills)]; // Remove duplicates
        };
        
        const extractExperience = (msg) => {
          // Patterns for experience: "X years", "X+ years", "X-Y years", etc.
          const experiencePatterns = [
            /(\d+)[\s-]*(\+)?[\s]*years?[\s]*(?:of|experience)?/gi,
            /(\d+)[\s-]*(\d+)?[\s]*years?[\s]*(?:of|experience)?/gi,
            /experience[\s:]+(\d+)[\s-]*(\+)?[\s]*years?/gi,
            /(\d+)[\s]+years?[\s]+(?:in|of|with)/gi
          ];
          
          for (const pattern of experiencePatterns) {
            const match = msg.match(pattern);
            if (match) {
              const years = match[0].match(/\d+/);
              if (years) {
                return parseInt(years[0]);
              }
            }
          }
          
          return null;
        };
        
        const extractLocation = (msg) => {
          // Common location keywords
          const locationKeywords = ['location', 'in', 'at', 'based in', 'located in', 'from'];
          const commonLocations = ['bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune',
                                  'kolkata', 'ahmedabad', 'gurgaon', 'noida', 'remote', 'work from home',
                                  'wfh', 'onsite', 'hybrid', 'usa', 'uk', 'canada', 'australia'];
          
          // Check for common locations
          for (const loc of commonLocations) {
            if (msg.toLowerCase().includes(loc)) {
              return loc;
            }
          }
          
          // Extract location after keywords
          const locationPatterns = [
            /(?:location|in|at|based in|located in|from)[\s:]+([A-Za-z\s]+?)(?:[,\n.]|$)/gi,
            /(?:i am|i'm|from|based)[\s]+(?:in|at)[\s]+([A-Za-z\s]+?)(?:[,\n.]|$)/gi
          ];
          
          for (const pattern of locationPatterns) {
            const match = msg.match(pattern);
            if (match && match[1]) {
              const loc = match[1].trim();
              if (loc.length > 2 && loc.length < 50) {
                return loc;
              }
            }
          }
          
          return null;
        };
        
        // Extract criteria from message
        const extractedSkills = extractSkills(message);
        const extractedExperience = extractExperience(message);
        const extractedLocation = extractLocation(message);
        
        // If no criteria extracted, provide helpful message
        if (extractedSkills.length === 0 && !extractedExperience && !extractedLocation) {
          return `🎯 I can help you find the perfect job match!\n\nPlease provide:\n• Your skills (e.g., "I know Java, React, SQL")\n• Your experience (e.g., "5 years experience")\n• Preferred location (e.g., "jobs in Bangalore" or "remote jobs")\n\nExample queries:\n• "Find jobs for me with Java and 5 years experience in Bangalore"\n• "Match jobs - I have React, Node.js skills, 3 years experience"\n• "Best jobs for Python developer with 2 years experience"\n• "Jobs in Mumbai for someone with 4 years Java experience"`;
        }
        
        // Get all jobs
        const allJobs = await jobAPI.getAll();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        
        if (jobsArray.length === 0) {
          return `❌ No jobs available in the system at the moment.`;
        }
        
        // Filter active jobs only
        const activeJobs = jobsArray.filter(job => {
          const status = job?.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'OPEN';
        });
        
        if (activeJobs.length === 0) {
          return `❌ No active jobs available at the moment.`;
        }
        
        // Score and match jobs
        const scoredJobs = activeJobs.map(job => {
          let score = 0;
          const matches = {
            skills: [],
            experience: false,
            location: false
          };
          
          // Match skills
          if (extractedSkills.length > 0 && job.skillsname) {
            const jobSkills = job.skillsname.toLowerCase();
            extractedSkills.forEach(skill => {
              if (jobSkills.includes(skill.toLowerCase())) {
                score += 10;
                matches.skills.push(skill);
              }
            });
          } else if (!extractedSkills.length && job.skillsname) {
            // If no skills specified, don't penalize
            score += 5;
          }
          
          // Match experience
          if (extractedExperience && job.jobExperience) {
            const jobExp = job.jobExperience.toLowerCase();
            const expMatch = jobExp.match(/(\d+)[\s-]*(\d+)?[\s]*years?/i);
            if (expMatch) {
              const jobExpYears = parseInt(expMatch[1]);
              const maxExp = expMatch[2] ? parseInt(expMatch[2]) : jobExpYears;
              
              // If user experience is within job range, it's a match
              if (extractedExperience >= jobExpYears && extractedExperience <= (maxExp || 20)) {
                score += 15;
                matches.experience = true;
              } else if (Math.abs(extractedExperience - jobExpYears) <= 2) {
                // Close match (within 2 years)
                score += 8;
                matches.experience = true;
              }
            } else if (jobExp.includes('fresher') || jobExp.includes('0')) {
              if (extractedExperience <= 1) {
                score += 15;
                matches.experience = true;
              }
            }
          } else if (!extractedExperience && job.jobExperience) {
            // If no experience specified, don't penalize
            score += 5;
          }
          
          // Match location
          if (extractedLocation && job.jobLocation) {
            const jobLoc = job.jobLocation.toLowerCase();
            const userLoc = extractedLocation.toLowerCase();
            
            if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
              score += 20;
              matches.location = true;
            } else if (jobLoc.includes('remote') && (userLoc.includes('remote') || userLoc.includes('wfh'))) {
              score += 20;
              matches.location = true;
            } else if (jobLoc.includes('hybrid') || jobLoc.includes('flexible')) {
              score += 10;
              matches.location = true;
            }
          } else if (!extractedLocation && job.jobLocation) {
            // If no location specified, don't penalize
            score += 5;
          }
          
          return { job, score, matches };
        });
        
        // Sort by score (highest first) and filter out zero scores
        const matchedJobs = scoredJobs
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Top 10 matches
        
        if (matchedJobs.length === 0) {
          let response = `❌ No matching jobs found based on your criteria.\n\n`;
          response += `📋 Extracted Criteria:\n`;
          if (extractedSkills.length > 0) {
            response += `• Skills: ${extractedSkills.join(', ')}\n`;
          } else {
            response += `• Skills: Not specified\n`;
          }
          if (extractedExperience) {
            response += `• Experience: ${extractedExperience} years\n`;
          } else {
            response += `• Experience: Not specified\n`;
          }
          if (extractedLocation) {
            response += `• Location: ${extractedLocation}\n`;
          } else {
            response += `• Location: Not specified\n`;
          }
          response += `\n💡 Try:\n• Being more specific about your skills\n• Checking available locations\n• Adjusting experience requirements\n• Type "list jobs" to see all available jobs`;
          return response;
        }
        
        // Format response
        let response = `🎯 FOUND ${matchedJobs.length} MATCHING JOB${matchedJobs.length !== 1 ? 'S' : ''}\n\n`;
        response += `📋 Your Criteria:\n`;
        if (extractedSkills.length > 0) {
          response += `• Skills: ${extractedSkills.join(', ')}\n`;
        }
        if (extractedExperience) {
          response += `• Experience: ${extractedExperience} years\n`;
        }
        if (extractedLocation) {
          response += `• Location: ${extractedLocation}\n`;
        }
        response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        matchedJobs.forEach((item, index) => {
          const job = item.job;
          response += `${index + 1}. 💼 ${job.jobName || 'Untitled Job'}\n`;
          response += `   Match Score: ${item.score}/50 ⭐\n\n`;
          
          if (job.jobLocation) {
            response += `   📍 Location: ${job.jobLocation}`;
            if (item.matches.location) response += ` ✅`;
            response += `\n`;
          }
          
          if (job.skillsname) {
            response += `   🛠️ Skills: ${job.skillsname}`;
            if (item.matches.skills.length > 0) {
              response += ` ✅ (Matched: ${item.matches.skills.join(', ')})`;
            }
            response += `\n`;
          }
          
          if (job.jobExperience) {
            response += `   💼 Experience: ${job.jobExperience}`;
            if (item.matches.experience) response += ` ✅`;
            response += `\n`;
          }
          
          if (job.jobSalaryRange) {
            response += `   💰 Salary: ${job.jobSalaryRange}\n`;
          }
          
          if (job.jobType) {
            response += `   📋 Type: ${job.jobType}\n`;
          }
          
          if (job.client?.clientName) {
            response += `   🏢 Client: ${job.client.clientName}\n`;
          }
          
          response += `\n`;
        });
        
        response += `\n💡 Tip: Click on any job above to view full details and apply!`;
        
        return response;
      } catch (error) {
        console.error('Error in job matching:', error);
        return handleNetworkError(error, 'job matching');
      }
    }

    // Simple keyword-based job search (e.g., "java", "java jobs", "show java jobs")
    // Check if message is a simple keyword search for jobs
    const isSimpleJobSearch = (msg, lowerMsg) => {
      const trimmed = lowerMsg.trim();
      const words = trimmed.split(/\s+/);
      
      // Skip if it's clearly not a job search (navigation commands, help, etc.)
      const skipPatterns = ['help', 'dashboard', 'candidates', 'applications', 'interviews', 
                           'clients', 'list jobs', 'show all', 'how many', 'what are'];
      if (skipPatterns.some(pattern => trimmed.includes(pattern))) {
        return null;
      }
      
      // Pattern 1: "java jobs", "python jobs", "react jobs", etc.
      if (lowerMsg.includes('job') || lowerMsg.includes('jobs')) {
        const stopWords = ['job', 'jobs', 'position', 'positions', 'opening', 'openings', 
                          'show', 'find', 'search', 'list', 'get', 'all', 'the', 'for', 'me',
                          'is', 'are', 'what', 'which', 'where', 'when', 'how', 'many', 'count'];
        const keywords = words.filter(word => !stopWords.includes(word) && word.length > 1);
        if (keywords.length > 0 && keywords.length <= 3) {
          return keywords.join(' ');
        }
      }
      
      // Pattern 2: "show java", "find react", "search python" (without "job" keyword)
      if ((trimmed.startsWith('show ') || trimmed.startsWith('find ') || trimmed.startsWith('search ')) &&
          words.length === 2 && !lowerMsg.includes('candidate') && !lowerMsg.includes('client') && 
          !lowerMsg.includes('application') && !lowerMsg.includes('interview')) {
        return words[1];
      }
      
      // Pattern 3: Single word that's likely a technology/skill (e.g., "java", "python", "react")
      if (words.length === 1 && trimmed.length > 2 && trimmed.length < 30) {
        const commandWords = ['help', 'jobs', 'job', 'list', 'show', 'find', 'search', 'dashboard'];
        if (!commandWords.includes(trimmed)) {
          return trimmed;
        }
      }
      
      return null;
    };
    
    const searchKeyword = isSimpleJobSearch(message, lowerMessage);
    
    // If it's a simple keyword search, search for jobs
    if (searchKeyword && searchKeyword.length > 1) {
      try {
        // Get all jobs
        const allJobs = await jobAPI.getAll();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        
        if (jobsArray.length === 0) {
          return `❌ No jobs available in the system.`;
        }
        
        // Filter active jobs and search by keyword
        const keyword = searchKeyword.toLowerCase();
        const matchingJobs = jobsArray.filter(job => {
          const status = job?.status?.toUpperCase();
          const isActive = status === 'ACTIVE' || status === 'OPEN';
          
          // Search in job name, skills, location, and description
          const jobName = (job.jobName || '').toLowerCase();
          const jobSkills = (job.skillsname || '').toLowerCase();
          const jobLocation = (job.jobLocation || '').toLowerCase();
          const jobDescription = (job.jobDiscription || job.jobDescription || '').toLowerCase();
          
          const matches = jobName.includes(keyword) || 
                         jobSkills.includes(keyword) || 
                         jobLocation.includes(keyword) ||
                         jobDescription.includes(keyword);
          
          return matches && isActive;
        });
        
        if (matchingJobs.length === 0) {
          return `❌ No active jobs found matching "${searchKeyword}".\n\n💡 Try:\n• Searching with a different keyword\n• Type "list jobs" to see all available jobs\n• Check spelling of your search term`;
        }
        
        // Format response
        let response = `🔍 FOUND ${matchingJobs.length} JOB${matchingJobs.length !== 1 ? 'S' : ''} MATCHING "${searchKeyword.toUpperCase()}"\n\n`;
        response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        matchingJobs.slice(0, 15).forEach((job, index) => {
          response += `${index + 1}. 💼 ${job.jobName || 'Untitled Job'}\n`;
          
          if (job.jobLocation) {
            response += `   📍 Location: ${job.jobLocation}\n`;
          }
          
          if (job.skillsname) {
            response += `   🛠️ Skills: ${job.skillsname}\n`;
          }
          
          if (job.jobExperience) {
            response += `   💼 Experience: ${job.jobExperience}\n`;
          }
          
          if (job.jobSalaryRange) {
            response += `   💰 Salary: ${job.jobSalaryRange}\n`;
          }
          
          if (job.jobType) {
            response += `   📋 Type: ${job.jobType}\n`;
          }
          
          if (job.client?.clientName) {
            response += `   🏢 Client: ${job.client.clientName}\n`;
          }
          
          response += `\n`;
        });
        
        if (matchingJobs.length > 15) {
          response += `... and ${matchingJobs.length - 15} more job${matchingJobs.length - 15 !== 1 ? 's' : ''} matching "${searchKeyword}".\n`;
        }
        
        response += `\n💡 Tip: Type "show [job name]" to view details of a specific job.`;
        
        return response;
      } catch (error) {
        console.error('Error searching jobs by keyword:', error);
        return handleNetworkError(error, 'job search');
      }
    }

    // Check for specific queries and fetch real data
    if (lowerMessage.includes('job') || lowerMessage.includes('position') || lowerMessage.includes('opening')) {
      // Check if user wants to navigate to jobs page
      if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all') || 
          lowerMessage === 'jobs' || lowerMessage === 'job') {
        return {
          navigate: '/jobs',
          message: `Click the button below to navigate to Jobs page.`,
          menuItem: 'jobs'
        };
      }
      
      try {
        // Check if user wants detailed list
        const wantsDetails = lowerMessage.includes('detail') || lowerMessage.includes('info');
        
        // Get all jobs
        const jobs = await jobAPI.getAll();
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        
        if (jobsArray.length === 0) {
          return "No jobs available in the system.";
        }
        
        // Filter active jobs
        const activeJobs = jobsArray.filter(job => {
          const status = job?.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'OPEN';
        });
        
        // Detect question type
        const asksHowMany = lowerMessage.includes('how many') || lowerMessage.includes('count');
        const asksList = wantsDetails || lowerMessage.includes('what are') || lowerMessage.includes('show me') || lowerMessage.includes('what job') || lowerMessage.includes('which job');

        if (asksList || wantsDetails) {
          // Return detailed list with question-aware response
          let response = isQuestion 
            ? `Here are the jobs in your system:\n\n`
            : `Here are your jobs:\n\n`;
          response += `📊 Total: ${jobsArray.length} | Active: ${activeJobs.length}\n\n`;
          
          // Show active jobs first
          if (activeJobs.length > 0) {
            response += `✅ ACTIVE JOBS:\n`;
            activeJobs.slice(0, 10).forEach((job, index) => {
              response += `${index + 1}. ${job.jobName || 'Untitled Job'}\n`;
              if (job.location) response += `   📍 Location: ${job.location}\n`;
              if (job.clientName) response += `   🏢 Client: ${job.clientName}\n`;
              if (job.status) response += `   📋 Status: ${job.status}\n`;
              response += `\n`;
            });
          }
          
          // Show other jobs if any
          const otherJobs = jobsArray.filter(job => {
            const status = job?.status?.toUpperCase();
            return status !== 'ACTIVE' && status !== 'OPEN';
          });
          
          if (otherJobs.length > 0 && activeJobs.length < 10) {
            response += `\n📋 OTHER JOBS:\n`;
            otherJobs.slice(0, 10 - activeJobs.length).forEach((job, index) => {
              response += `${index + 1}. ${job.jobName || 'Untitled Job'} (${job.status || 'N/A'})\n`;
            });
          }
          
          if (jobsArray.length > 10) {
            response += `\n... and ${jobsArray.length - 10} more job${jobsArray.length - 10 !== 1 ? 's' : ''}.`;
          }
          
          return response;
        } else if (asksHowMany) {
          // Answer "how many" questions
          return `You have ${activeJobs.length} active job${activeJobs.length !== 1 ? 's' : ''} out of ${jobsArray.length} total job${jobsArray.length !== 1 ? 's' : ''} in the system.`;
        } else {
          // Default response with suggestion
          return `You have ${activeJobs.length} active job${activeJobs.length !== 1 ? 's' : ''} out of ${jobsArray.length} total job${jobsArray.length !== 1 ? 's' : ''} in the system. ${isQuestion ? 'Would you like to see the list of jobs?' : 'Ask me "show all jobs" or "list jobs" for detailed information.'}`;
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        return handleNetworkError(error, 'job data');
      }
    }

    // Handle date-based candidate queries (yesterday, specific dates) - works in any order
    // Try to extract date from message first (various formats) - works in any position
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
      /(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
      /(\d{2}-\d{2}-\d{4})/, // DD-MM-YYYY or MM-DD-YYYY
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i, // Month DD, YYYY
      /(\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december),?\s+\d{4})/i // DD Month YYYY
    ];
    
    let extractedDate = null;
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        try {
          extractedDate = new Date(match[1]);
          if (!isNaN(extractedDate.getTime())) {
            extractedDate.setHours(0, 0, 0, 0);
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    // Check if message contains candidate-related keywords (anywhere in message)
    const hasCandidateKeywords = lowerMessage.includes('candidate') || 
                                 lowerMessage.includes('applicant') || 
                                 lowerMessage.includes('list') ||
                                 trimmedMessage === 'yesterday' ||
                                 trimmedMessage === 'yesterday list';
    
    // Check if message contains date-related keywords (anywhere in message)
    const hasDateKeywords = lowerMessage.includes('yesterday') || 
                           lowerMessage.includes('today') ||
                           lowerMessage.includes('date') ||
                           lowerMessage.includes('on ') ||
                           lowerMessage.includes('created on') ||
                           lowerMessage.includes('added on') ||
                           lowerMessage.includes('created') ||
                           lowerMessage.includes('added') ||
                           lowerMessage.includes('last week') ||
                           lowerMessage.includes('previous week') ||
                           lowerMessage.includes('last month') ||
                           lowerMessage.includes('previous month');
    
    // More flexible detection: If ANY of these conditions are true, treat as date-based query
    // 1. Has date pattern AND (candidate keywords OR list/show/find)
    // 2. Has date keywords AND (candidate keywords OR list/show/find)
    // 3. Has candidate keywords AND (date keywords OR extracted date)
    // 4. Just a date pattern (likely a date search)
    // 5. Just date keywords like "yesterday", "today" (likely a date search)
    const messageWords = trimmedMessage.split(/\s+/);
    const isDateQuery = (extractedDate && (hasCandidateKeywords || lowerMessage.includes('list') || 
                                          lowerMessage.includes('show') || lowerMessage.includes('find') ||
                                          lowerMessage.includes('get') || messageWords.length <= 4)) ||
                        (hasDateKeywords && (hasCandidateKeywords || lowerMessage.includes('list') || 
                                            lowerMessage.includes('show') || lowerMessage.includes('find'))) ||
                        (hasCandidateKeywords && (hasDateKeywords || extractedDate)) ||
                        (extractedDate && messageWords.length <= 4) || // Just a date, likely a search
                        (trimmedMessage === 'yesterday' || trimmedMessage === 'today' || 
                         trimmedMessage === 'yesterday list' || trimmedMessage === 'today list');
    
    if (isDateQuery) {
      try {
        const candidates = await candidateAPI.getAll();
        const candidatesArray = Array.isArray(candidates) ? candidates : [];
        
        // Helper function to format date for comparison
        const formatDateForComparison = (date) => {
          if (!date) return null;
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d;
        };
        
        // Check for "yesterday" query
        if (lowerMessage.includes('yesterday')) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          
          const yesterdayCandidates = candidatesArray.filter(candidate => {
            if (!candidate.createdAt) return false;
            const candidateDate = formatDateForComparison(candidate.createdAt);
            return candidateDate && candidateDate.getTime() === yesterday.getTime();
          });
          
          if (yesterdayCandidates.length === 0) {
            const yesterdayStr = yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return `📅 No candidates were added yesterday (${yesterdayStr}).`;
          }
          
          // Format status for display
          const formatStatus = (status) => {
            if (!status) return 'N/A';
            return status.toLowerCase()
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          };
          
          // Return object with candidates array for clickable navigation
          return {
            message: `📅 YESTERDAY'S CANDIDATES (${yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})\n\nTotal Count: ${yesterdayCandidates.length} candidate${yesterdayCandidates.length !== 1 ? 's' : ''}\n\nClick on any candidate below to view details:`,
            applications: yesterdayCandidates.slice(0, 20).map(candidate => ({
              id: candidate.id,
              name: candidate.name || 'Unknown',
              type: 'candidate',
              navigate: `/candidates/${candidate.id}`,
              displayText: `${candidate.name || 'Unknown'} - ${formatStatus(candidate.status)}`
            }))
          };
        }
        
        // Use extracted date or check for relative dates like "today", "last week", etc.
        let targetDate = extractedDate;
        
        if (!targetDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (lowerMessage.includes('today')) {
            targetDate = today;
          } else if (lowerMessage.includes('last week') || lowerMessage.includes('previous week')) {
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() - 7);
          } else if (lowerMessage.includes('last month') || lowerMessage.includes('previous month')) {
            targetDate = new Date(today);
            targetDate.setMonth(today.getMonth() - 1);
          }
        }
        
        if (targetDate) {
          const dateCandidates = candidatesArray.filter(candidate => {
            if (!candidate.createdAt) return false;
            const candidateDate = formatDateForComparison(candidate.createdAt);
            return candidateDate && candidateDate.getTime() === targetDate.getTime();
          });
          
          if (dateCandidates.length === 0) {
            const dateStr = targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return `📅 No candidates were added on ${dateStr}.`;
          }
          
          // Format status for display
          const formatStatus = (status) => {
            if (!status) return 'N/A';
            return status.toLowerCase()
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          };
          
          // Return object with candidates array for clickable navigation
          return {
            message: `📅 CANDIDATES ON ${targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\nTotal Count: ${dateCandidates.length} candidate${dateCandidates.length !== 1 ? 's' : ''}\n\nClick on any candidate below to view details:`,
            applications: dateCandidates.slice(0, 20).map(candidate => ({
              id: candidate.id,
              name: candidate.name || 'Unknown',
              type: 'candidate',
              navigate: `/candidates/${candidate.id}`,
              displayText: `${candidate.name || 'Unknown'} - ${formatStatus(candidate.status)}`
            }))
          };
        } else {
          // If date not found but user asked about dates, provide help
          return `📅 I can help you find candidates by date!\n\nTry asking:\n• "yesterday list" or "candidates yesterday"\n• "candidates on 2024-01-15" or "candidates created on 01/15/2024"\n• "candidates today"\n• "candidates last week"\n\nPlease specify a date in formats like:\n• YYYY-MM-DD (e.g., 2024-01-15)\n• MM/DD/YYYY (e.g., 01/15/2024)\n• DD-MM-YYYY (e.g., 15-01-2024)`;
        }
      } catch (error) {
        console.error('Error fetching candidates by date:', error);
        return handleNetworkError(error, 'candidate date search');
      }
    }

    if (lowerMessage.includes('candidate') || lowerMessage.includes('applicant')) {
      try {
        // Check if user is searching for candidates by status
        // Map common status names to actual status values
        const statusMap = {
          'pending': 'PENDING',
          'scheduled': 'SCHEDULED',
          'interviewed': 'INTERVIEWED',
          'placed': 'PLACED',
          'rejected': 'REJECTED',
          'not interested': 'NOT_INTERESTED',
          'hold': 'HOLD',
          'high ctc': 'HIGH_CTC',
          'dropped by client': 'DROPPED_BY_CLIENT',
          'submitted to client': 'SUBMITTED_TO_CLIENT',
          'no response': 'NO_RESPONSE',
          'immediate': 'IMMEDIATE',
          'rejected by client': 'REJECTED_BY_CLIENT',
          'client shortlist': 'CLIENT_SHORTLIST',
          'first interview scheduled': 'FIRST_INTERVIEW_SCHEDULED',
          'first interview feedback pending': 'FIRST_INTERVIEW_FEEDBACK_PENDING',
          'first interview reject': 'FIRST_INTERVIEW_REJECT',
          'second interview scheduled': 'SECOND_INTERVIEW_SCHEDULED',
          'second interview feedback pending': 'SECOND_INTERVIEW_FEEDBACK_PENDING',
          'second interview reject': 'SECOND_INTERVIEW_REJECT',
          'third interview scheduled': 'THIRD_INTERVIEW_SCHEDULED',
          'third interview feedback pending': 'THIRD_INTERVIEW_FEEDBACK_PENDING',
          'third interview reject': 'THIRD_INTERVIEW_REJECT',
          'internal reject': 'INTERNEL_REJECT',
          'client reject': 'CLIENT_REJECT',
          'final select': 'FINAL_SELECT',
          'joined': 'JOINED',
          'backedout': 'BACKEDOUT',
          'not relevant': 'NOT_RELEVANT',
          'new candidate': 'NEW_CANDIDATE',
          'new': 'NEW_CANDIDATE'
        };

        // Check if message contains a status keyword
        let detectedStatus = null;
        let statusDisplayName = null;
        
        // Check for status in various formats
        for (const [key, value] of Object.entries(statusMap)) {
          if (lowerMessage.includes(key)) {
            detectedStatus = value;
            statusDisplayName = key.charAt(0).toUpperCase() + key.slice(1);
            break;
          }
        }
        
        // Also check for direct status mentions (uppercase with underscores)
        const statusPattern = /\b([A-Z_]+)\b/;
        const statusMatch = message.match(statusPattern);
        if (statusMatch && !detectedStatus) {
          const potentialStatus = statusMatch[1];
          // Check if it's a valid status format
          if (potentialStatus.includes('_') || ['PENDING', 'SCHEDULED', 'REJECTED', 'PLACED', 'HOLD'].includes(potentialStatus)) {
            detectedStatus = potentialStatus;
            statusDisplayName = potentialStatus.replace(/_/g, ' ').toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
        }

        // If status detected, fetch candidates with that status
        if (detectedStatus) {
          try {
            const candidatesByStatus = await candidateAPI.getByStatus(detectedStatus);
            const candidatesArray = Array.isArray(candidatesByStatus) ? candidatesByStatus : [];
            
            if (candidatesArray.length === 0) {
              return `❌ No candidates found with status "${statusDisplayName || detectedStatus}".\n\nYou can try:\n• Type "list candidates" to see all candidates\n• Type "help" to see available statuses`;
            }
            
            // Format status for display
            const formatStatus = (status) => {
              if (!status) return 'N/A';
              return status.toLowerCase()
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            };
            
            // Return object with candidates array for clickable navigation
            return {
              message: `📋 CANDIDATES WITH STATUS: ${statusDisplayName || formatStatus(detectedStatus)}\n\nTotal Count: ${candidatesArray.length} candidate${candidatesArray.length !== 1 ? 's' : ''}\n\nClick on any candidate below to view details:`,
              applications: candidatesArray.slice(0, 20).map(candidate => ({
                id: candidate.id,
                name: candidate.name || 'Unknown',
                type: 'candidate',
                navigate: `/candidates/${candidate.id}`,
                displayText: `${candidate.name || 'Unknown'} - ${formatStatus(candidate.status)}`
              }))
            };
          } catch (error) {
            console.error('Error fetching candidates by status:', error);
            return `❌ Error fetching candidates with status "${statusDisplayName || detectedStatus}".\n\n${handleNetworkError(error, 'candidate status search')}`;
          }
        }
        
        // Check if user is searching for a specific candidate by name
        // BUT skip if this is a recruiter query (to avoid false matches)
        const isRecruiterQueryCheck = (lowerMessage.includes('candidate') && 
                                       (lowerMessage.includes('added') || lowerMessage.includes('created')) && 
                                       (lowerMessage.includes('by') || lowerMessage.includes('recruiter') || lowerMessage.includes('user')));
        
        if (!isRecruiterQueryCheck) {
          // Extract potential candidate name from the message
          const candidateNamePattern = /(?:candidate|applicant|search|find|show|details?|info|about)\s+(?:named|name|is|called)?\s*([A-Z][a-zA-Z\s]{2,30})/i;
          const nameMatch = message.match(candidateNamePattern);
          const directNamePattern = /^(?:who is|tell me about|show|find|search|details?|info about)\s+([A-Z][a-zA-Z\s]{2,30})/i;
          const directNameMatch = message.match(directNamePattern);
          
          // Check if message contains a name (capitalized words that might be a person's name)
          // BUT exclude if it appears after "by recruiter" or "by user"
          const words = message.split(/\s+/);
          const potentialNames = words.filter((word, index) => {
            const prevWord = index > 0 ? words[index - 1].toLowerCase() : '';
            const prevPrevWord = index > 1 ? words[index - 2].toLowerCase() : '';
            // Skip if word appears after "by", "recruiter", or "user"
            if (prevWord === 'by' || prevWord === 'recruiter' || prevWord === 'user' || 
                (prevPrevWord === 'by' && prevWord === 'recruiter')) {
              return false;
            }
            return word.length > 2 && 
                   /^[A-Z][a-z]+$/.test(word) && 
                   !['Show', 'List', 'Find', 'Search', 'Tell', 'About', 'Details', 'Info', 'Candidate', 'Applicant', 'How', 'Many', 'What', 'When', 'Where', 'Why', 'Which', 'Admin'].includes(word);
          });
          
          // If we have a potential name, search for that candidate
          if (nameMatch || directNameMatch || (potentialNames.length > 0 && potentialNames.length <= 3)) {
            const searchName = nameMatch?.[1] || directNameMatch?.[1] || potentialNames.join(' ');
            
            // Search for candidates by name
            const searchResults = await candidateAPI.search(searchName);
            const searchArray = Array.isArray(searchResults) ? searchResults : [];
            
            if (searchArray.length === 0) {
              return `❌ No candidate found with the name "${searchName}".\n\nPlease check the spelling or try searching with a different name. You can also:\n• Type "list candidates" to see all candidates\n• Type "help" to see what I can do`;
            }
            
            // If multiple candidates found, navigate to first candidate's detail page
            const candidate = searchArray[0];
            
            // Return navigation instruction instead of showing details
            return {
              navigate: `/candidates/${candidate.id}`,
              message: `Found candidate: ${candidate.name || searchName}\n\nClick the button below to view candidate details.`,
              candidateName: candidate.name || searchName
            };
          }
        }
        
        // Check if user wants to navigate to candidates page
        if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all') ||
            lowerMessage === 'candidates' || lowerMessage === 'candidate') {
          return {
            navigate: '/candidates',
            message: `Click the button below to navigate to Candidates page.`,
            menuItem: 'candidates'
          };
        }
        
        // Check if user wants detailed list
        const wantsDetails = lowerMessage.includes('detail') || lowerMessage.includes('info') || lowerMessage.includes('who are');
        const asksHowMany = lowerMessage.includes('how many');
        
        if (wantsDetails) {
          const candidates = await candidateAPI.getAll();
          const candidatesArray = Array.isArray(candidates) ? candidates : [];
          
          if (candidatesArray.length === 0) {
            return "No candidates available in the system.";
          }
          
          let response = isQuestion
            ? `Here are the candidates in your database:\n\n`
            : `Here are ${candidatesArray.length} candidate${candidatesArray.length !== 1 ? 's' : ''}:\n\n`;
          
          candidatesArray.slice(0, 10).forEach((candidate, index) => {
            response += `${index + 1}. ${candidate.name || 'Unknown'}\n`;
            if (candidate.email) response += `   📧 Email: ${candidate.email}\n`;
            if (candidate.phone) response += `   📞 Phone: ${candidate.phone}\n`;
            if (candidate.status) response += `   📋 Status: ${candidate.status}\n`;
            response += `\n`;
          });
          
          if (candidatesArray.length > 10) {
            response += `... and ${candidatesArray.length - 10} more candidate${candidatesArray.length - 10 !== 1 ? 's' : ''}.`;
          }
          
          return response;
        } else if (asksHowMany) {
          try {
          const count = await candidateAPI.getCount();
          return `You have ${count} candidate${count !== 1 ? 's' : ''} in your database.`;
          } catch {
            const candidates = await candidateAPI.getAll();
            const count = Array.isArray(candidates) ? candidates.length : 0;
            return `You have ${count} candidate${count !== 1 ? 's' : ''} in your database.`;
          }
        } else {
          try {
          const count = await candidateAPI.getCount();
            return `You have ${count} candidate${count !== 1 ? 's' : ''} in your database. ${isQuestion ? 'Would you like to see the list?' : 'Ask me "show all candidates" or "list candidates" for detailed information. You can also search for a specific candidate by name, e.g., "show candidate John Doe" or "find candidate named Sarah".'}`;
          } catch {
            const candidates = await candidateAPI.getAll();
            const count = Array.isArray(candidates) ? candidates.length : 0;
            return `You have ${count} candidate${count !== 1 ? 's' : ''} in your database. ${isQuestion ? 'Would you like to see the list?' : 'Ask me "show all candidates" or "list candidates" for detailed information. You can also search for a specific candidate by name, e.g., "show candidate John Doe" or "find candidate named Sarah".'}`;
          }
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
        return handleNetworkError(error, 'candidate information');
      }
    }

    if (lowerMessage.includes('application') || lowerMessage.includes('apply')) {
      // Check if user wants to navigate to applications page
      if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all') ||
          lowerMessage === 'applications' || lowerMessage === 'application') {
        return {
          navigate: '/applications',
          message: `Click the button below to navigate to Applications page.`,
          menuItem: 'applications'
        };
      }
      
      try {
        // Check if user wants detailed list
        const wantsDetails = lowerMessage.includes('detail') || lowerMessage.includes('info') || lowerMessage.includes('what are');
        const asksHowMany = lowerMessage.includes('how many');
        const asksStatus = lowerMessage.includes('status') || lowerMessage.includes('pending') || lowerMessage.includes('rejected');
        
        if (wantsDetails || asksStatus) {
          const applications = await applicationAPI.getAll();
          const applicationsArray = Array.isArray(applications) ? applications : [];
          
          if (applicationsArray.length === 0) {
            return "No applications available in the system.";
          }
          
          // Group by status
          const byStatus = {};
          applicationsArray.forEach(app => {
            const status = app.status || 'UNKNOWN';
            if (!byStatus[status]) byStatus[status] = [];
            byStatus[status].push(app);
          });
          
          let response = isQuestion
            ? `Here are the applications in your system:\n\n`
            : `Here are ${applicationsArray.length} application${applicationsArray.length !== 1 ? 's' : ''}:\n\n`;
          
          // Show by status
          Object.entries(byStatus).slice(0, 5).forEach(([status, apps]) => {
            response += `📋 ${status} (${apps.length}):\n`;
            apps.slice(0, 3).forEach((app, index) => {
              const candidateName = app.candidateName || app.candidate?.name || 'Unknown';
              const jobTitle = app.jobTitle || app.job?.jobName || 'Unknown Job';
              response += `   ${index + 1}. ${candidateName} → ${jobTitle}\n`;
            });
            if (apps.length > 3) {
              response += `   ... and ${apps.length - 3} more\n`;
            }
            response += `\n`;
          });
          
          if (applicationsArray.length > 15) {
            response += `... and ${applicationsArray.length - 15} more application${applicationsArray.length - 15 !== 1 ? 's' : ''}.`;
          }
          
          return response;
        } else if (asksHowMany) {
          const count = await applicationAPI.getCount();
          return `You have ${count} application${count !== 1 ? 's' : ''} in the system.`;
        } else {
          const count = await applicationAPI.getCount();
          return `You have ${count} application${count !== 1 ? 's' : ''} in the system. ${isQuestion ? 'Would you like to see the details?' : 'Ask me "show all applications" or "list applications" for detailed information.'}`;
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        return handleNetworkError(error, 'application information');
      }
    }

    // Interview queries - check for detailed requests first
    if (lowerMessage.includes('interview') || lowerMessage.includes('schedule')) {
      // Check if user wants to navigate to interviews page
      if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all') ||
          lowerMessage === 'interviews' || lowerMessage === 'interview') {
        return {
          navigate: '/interviews',
          message: `Click the button below to navigate to Interviews page.`,
          menuItem: 'interviews'
        };
      }
      
      try {
        // Check if user wants detailed list
        const wantsDetails = lowerMessage.includes('detail') || lowerMessage.includes('who') || 
                            lowerMessage.includes('what') || lowerMessage.includes('info');
        
        // Check for date-specific queries
        const isToday = lowerMessage.includes('today') || lowerMessage.includes('today\'s');
        const isTomorrow = lowerMessage.includes('tomorrow');
        const isThisWeek = lowerMessage.includes('this week') || lowerMessage.includes('week');
        const asksHowMany = lowerMessage.includes('how many');
        const asksWho = lowerMessage.includes('who') && (isToday || isTomorrow);
        
        if (wantsDetails || isToday || isTomorrow || isThisWeek || asksWho) {
          // Fetch all interviews
          const interviews = await interviewAPI.getAll();
          const interviewsArray = Array.isArray(interviews) ? interviews : [];
          
          if (interviewsArray.length === 0) {
            return "No interviews scheduled.";
          }
          
          // Filter by date if needed
          let filteredInterviews = interviewsArray;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (isToday) {
            filteredInterviews = interviewsArray.filter(interview => {
              const interviewDate = new Date(interview.interviewDate);
              interviewDate.setHours(0, 0, 0, 0);
              return interviewDate.getTime() === today.getTime();
            });
          } else if (isTomorrow) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filteredInterviews = interviewsArray.filter(interview => {
              const interviewDate = new Date(interview.interviewDate);
              interviewDate.setHours(0, 0, 0, 0);
              return interviewDate.getTime() === tomorrow.getTime();
            });
          } else if (isThisWeek) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            filteredInterviews = interviewsArray.filter(interview => {
              const interviewDate = new Date(interview.interviewDate);
              return interviewDate >= today && interviewDate <= weekEnd;
            });
          }
          
          if (filteredInterviews.length === 0) {
            const dateText = isToday ? 'today' : isTomorrow ? 'tomorrow' : isThisWeek ? 'this week' : '';
            return `No interviews scheduled ${dateText}.`;
          }
          
          // Format detailed response with question-aware context
          let response = asksWho
            ? `Here are the people scheduled for interviews ${isToday ? 'today' : isTomorrow ? 'tomorrow' : isThisWeek ? 'this week' : ''}:\n\n`
            : isQuestion
            ? `Here are the interviews scheduled ${isToday ? 'today' : isTomorrow ? 'tomorrow' : isThisWeek ? 'this week' : ''}:\n\n`
            : `Here are ${filteredInterviews.length} interview${filteredInterviews.length !== 1 ? 's' : ''}:\n\n`;
          
          filteredInterviews.slice(0, 10).forEach((interview, index) => {
            const date = new Date(interview.interviewDate);
            const formattedDate = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
            const time = interview.interviewTime || 'N/A';
            const endTime = interview.endTime || '';
            const timeRange = endTime ? `${time} - ${endTime}` : time;
            
            response += `${index + 1}. ${interview.candidateName || 'Unknown Candidate'}\n`;
            response += `   📋 Job: ${interview.jobTitle || 'N/A'}\n`;
            if (interview.clientName) {
              response += `   🏢 Client: ${interview.clientName}\n`;
            }
            response += `   📅 Date: ${formattedDate}\n`;
            response += `   ⏰ Time: ${timeRange}\n\n`;
          });
          
          if (filteredInterviews.length > 10) {
            response += `... and ${filteredInterviews.length - 10} more interview${filteredInterviews.length - 10 !== 1 ? 's' : ''}.`;
          }
          
          return response;
        } else if (asksHowMany) {
          // Answer "how many" questions
          const count = await interviewAPI.getCount();
          return `You have ${count} interview${count !== 1 ? 's' : ''} scheduled for today.`;
        } else {
          // Default response
          const count = await interviewAPI.getCount();
          return `You have ${count} interview${count !== 1 ? 's' : ''} scheduled for today. ${isQuestion ? 'Would you like to see the details?' : 'Ask me "show interviews today" or "list all interviews" for detailed information.'}`;
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
        return handleNetworkError(error, 'interview data');
      }
    }

    // General help queries - Professional and Concise
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('features') || lowerMessage.includes('ats features')) {
         return `Quick Insights I Provide:

• New applications count
• Pending follow-ups and actions
• Missing documents
• Interview schedules
• Candidate summaries

Example Queries:
• "New applications"
• "Pending follow-ups"
• "Missing documents"
• "Interviews today"
• "Candidate summary"

Navigation:
Type any menu item name (jobs, candidates, applications, interviews) to navigate directly.`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const username = localStorage.getItem('username') || 'Recruiter';
      return `Hello ${username}! How can I assist you today?`;
    }

    // Enhanced question understanding for other queries
    const asksWhat = lowerMessage.startsWith('what') || lowerMessage.startsWith('which');
    const asksHow = lowerMessage.startsWith('how');
    const asksWhen = lowerMessage.startsWith('when');
    const asksWhere = lowerMessage.startsWith('where');
    const asksWhy = lowerMessage.startsWith('why');
    
    // Use chatbot API for other queries
    try {
      const response = await chatbotAPI.sendMessage(message);
      // If the response seems generic, enhance it based on question type
      if (isQuestion && response.includes("I understand you're asking about")) {
        if (asksWhat) {
          return `Based on your question "${message}", I can help you find information about jobs, candidates, applications, or interviews. Could you be more specific? For example:\n• "What jobs do we have?"\n• "What candidates are in the system?"\n• "What interviews are scheduled today?"`;
        } else if (asksHow) {
          return `I can help you with how-to questions about the ATS system. For example:\n• "How do I create a job?"\n• "How many candidates are there?"\n• "How do I schedule an interview?"\n\nWhat would you like to know how to do?`;
        } else if (asksWhen) {
          return `I can help you find information about dates and schedules. For example:\n• "When are the interviews today?"\n• "When was this job posted?"\n• "When is the next interview?"\n\nWhat date-related information do you need?`;
        } else if (asksWhere) {
          return `I can help you find where things are located in the system. For example:\n• "Where can I see all jobs?" - Go to the Jobs section\n• "Where are the candidates?" - Go to the Candidates section\n• "Where do I manage interviews?" - Go to the Interviews section\n\nWhat are you looking for?`;
        } else if (asksWhy) {
          return `I can help explain features and processes in the ATS system. Could you be more specific about what you'd like to understand? For example:\n• "Why is this application pending?"\n• "Why can't I see certain candidates?"\n\nWhat would you like me to explain?`;
        }
      }
      return response;
    } catch {
      // Enhanced fallback based on question type
      if (isQuestion) {
        if (asksWhat) {
          return `I can help you find information about jobs, candidates, applications, and interviews. Could you be more specific? For example:\n• "What jobs do we have?"\n• "What candidates are in the system?"\n• "What interviews are scheduled today?"`;
        } else if (asksHow) {
          return `I can help you with how-to questions. Try asking:\n• "How many jobs do we have?"\n• "How do I create a candidate?"\n• "How many interviews are today?"`;
        } else {
          return `I understand you're asking: "${message}". I can help you with questions about jobs, candidates, applications, and interviews. Could you be more specific?`;
        }
      }
      return "I understand you're asking about: " + message + ". For detailed information, please check the relevant section in the dashboard. Is there anything specific I can help you with?";
    }
  };

  const handleQuickAction = async (action) => {
    // Mark user as interacted to hide welcome message
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      setMessages(prev => prev.filter(msg => msg.id !== 1));
    }
    
    setIsLoading(true);
    
    // Route mapping for navigation
    const routeMap = {
      'jobs': '/jobs',
      'candidates': '/candidates',
      'applications': '/applications',
      'interviews': '/Interviews'
    };
    
    // Action labels for button text
    const actionLabels = {
      'jobs': 'Jobs',
      'candidates': 'Candidates',
      'applications': 'Applications',
      'interviews': 'Interviews'
    };
    
    try {
      let response = '';
      
      if (action === 'candidates') {
        try {
          const count = await candidateAPI.getCount();
          response = `📊 CANDIDATES OVERVIEW\n\nTotal Candidates: ${count}`;
        } catch {
          const candidates = await candidateAPI.getAll();
          const count = Array.isArray(candidates) ? candidates.length : 0;
          response = `📊 CANDIDATES OVERVIEW\n\nTotal Candidates: ${count}`;
        }
      } else if (action === 'jobs') {
        const jobs = await jobAPI.getAll();
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        const activeJobs = jobsArray.filter(job => {
          const status = job?.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'OPEN';
        });
        response = `📊 JOBS OVERVIEW\n\nTotal Jobs: ${jobsArray.length}\nActive Jobs: ${activeJobs.length}`;
      } else if (action === 'applications') {
        try {
          const count = await applicationAPI.getCount();
          response = `📊 APPLICATIONS OVERVIEW\n\nTotal Applications: ${count}`;
        } catch {
          const applications = await applicationAPI.getAll();
          const count = Array.isArray(applications) ? applications.length : 0;
          response = `📊 APPLICATIONS OVERVIEW\n\nTotal Applications: ${count}`;
        }
      } else if (action === 'interviews') {
        try {
          const count = await interviewAPI.getCount();
          response = `📊 INTERVIEWS OVERVIEW\n\nTotal Interviews: ${count}`;
        } catch {
          const interviews = await interviewAPI.getAll();
          const interviewsArray = Array.isArray(interviews) ? interviews : [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayInterviews = interviewsArray.filter(interview => {
            const interviewDate = new Date(interview.interviewDate);
            interviewDate.setHours(0, 0, 0, 0);
            return interviewDate.getTime() === today.getTime();
          });
          response = `📊 INTERVIEWS OVERVIEW\n\nTotal Interviews: ${interviewsArray.length}\nToday's Interviews: ${todayInterviews.length}`;
        }
      }
      
      const route = routeMap[action];
      const actionLabel = actionLabels[action] || action;
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        navigate: route, // Add navigate property to show button
        entityName: actionLabel
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `❌ Error fetching ${action} information. Please try again.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActionIcons = {
    jobs: FaBriefcase,
    candidates: FaUserTie,
    applications: FaFileAlt,
    interviews: FaCalendarAlt
  };

  return (
    <>
      {/* Modern Chat Button - Responsive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 text-white rounded-full shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95 group backdrop-blur-sm border-2 border-white/20 p-0"
          style={{ backgroundColor: '#3A9188' }}
          aria-label="Open chatbot"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" style={{ backgroundColor: '#4CAF9F' }}></div>
          
          {/* Icon container */}
          <div className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300">
            <FaRobot className="text-xl sm:text-2xl drop-shadow-lg" />
          </div>
          
          {/* Status indicator */}
          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1">
            <div className="relative">
              <span className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white animate-ping" style={{ backgroundColor: '#4CAF9F' }}></span>
              <span className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white shadow-md" style={{ backgroundColor: '#3A9188' }}></span>
            </div>
          </div>
          
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-white/10 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500"></div>
        </button>
      )}

      {/* Backdrop overlay - closes chatbot when clicked outside (transparent, no blur) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleCloseChatbot}
          aria-hidden="true"
        />
      )}

      {/* Modern Chat Window - Responsive */}
      {isOpen && (
        <div 
          className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[700px] h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl flex z-50 border border-gray-100 overflow-hidden backdrop-blur-xl bg-white/95 chatbot-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chat History Sidebar */}
          <div className={`${showChatSidebar ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-gray-50 flex flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={handleNewChat}
                className="w-full px-4 py-2.5 bg-[#3A9188] text-white rounded-lg hover:bg-[#2E7D6E] transition-colors flex items-center justify-center space-x-2 font-semibold text-sm"
              >
                <FaPlus className="text-sm" />
                <span>New Chat</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Chat History</h3>
              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <FaHistory className="text-2xl mx-auto mb-2 opacity-50" />
                  <p>No chat history</p>
                  <p className="text-xs mt-1">Start a conversation to see it here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleLoadChat(chat.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                        currentChatId === chat.id
                          ? 'bg-[#3A9188] text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${currentChatId === chat.id ? 'text-white' : 'text-gray-800'}`}>
                            {chat.title}
                          </p>
                          <p className={`text-xs mt-1 ${currentChatId === chat.id ? 'text-white/80' : 'text-gray-500'}`}>
                            {new Date(chat.timestamp).toLocaleDateString()} {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className={`text-xs mt-1 ${currentChatId === chat.id ? 'text-white/70' : 'text-gray-400'}`}>
                            {chat.messages.filter(m => m.sender === 'user').length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                            currentChatId === chat.id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Delete chat"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
          {/* Modern Header - Responsive */}
          <div className="text-white p-3 sm:p-4 rounded-t-3xl flex items-center justify-between relative overflow-hidden" style={{ backgroundColor: '#3A9188' }}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
            </div>
            
            {/* Sidebar Toggle */}
            <div className="flex items-center space-x-2 relative z-10">
              <button
                onClick={() => setShowChatSidebar(!showChatSidebar)}
                className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-110 relative z-10 backdrop-blur-sm border border-white/20"
                aria-label="Toggle chat history"
                title="Chat History"
              >
                <FaBars className="text-lg sm:text-xl" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 flex-1">
              {/* Avatar with glow effect */}
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl transform hover:scale-105 transition-transform">
                  <FaRobot className="text-base sm:text-lg drop-shadow-lg" />
                </div>
                {/* Status badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white shadow-md animate-pulse" style={{ backgroundColor: '#4CAF9F' }}></span>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl blur-xl animate-pulse" style={{ backgroundColor: 'rgba(58, 145, 136, 0.3)' }}></div>
              </div>
              
              {/* Title and status */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl drop-shadow-sm">ATS Assistant</h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: '#4CAF9F' }}></span>
                  <p className="text-xs sm:text-sm text-white/90 font-medium truncate">Online • Ready to help</p>
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleCloseChatbot}
              className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90 hover:scale-110 relative z-10 backdrop-blur-sm border border-white/20"
              aria-label="Close chatbot"
            >
              <FaTimes className="text-lg sm:text-xl" />
            </button>
          </div>

          {/* Modern Messages Container - Responsive */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-50 scrollbar-hide relative">
            {/* Centered Welcome Message - Only show when no user interaction */}
            {!hasUserInteracted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4 max-w-md">
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3A9188] to-[#4CAF9F] flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                      <span className="text-4xl">👋</span>
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                    Welcome {username}!
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    How can I help you today?
                  </p>
                  <p className="text-sm text-gray-500">
                    Ask me anything about jobs, candidates, applications, or interviews
                  </p>
                </div>
              </div>
            )}
            
            {/* Chat Messages - Only show when user has interacted */}
            {hasUserInteracted && messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div
                  className={`${message.sender === 'bot' ? 'w-full' : 'max-w-[88%] sm:max-w-[80%]'} rounded-2xl sm:rounded-3xl ${message.sender === 'user' ? 'px-2.5 py-1.5 sm:px-3 sm:py-2' : 'px-4 py-3 sm:px-5 sm:py-4'} shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
                    message.sender === 'user'
                      ? 'bg-gray-100 text-gray-800 rounded-br-md shadow-gray-200/50 border border-gray-200'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-gray-200/50'
                  }`}
                >
                  <div className={`flex items-start ${message.sender === 'bot' ? 'space-x-3' : ''}`}>
                    {/* Avatar - Only for bot messages */}
                    {message.sender === 'bot' && (
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#3A9188' }}>
                          <FaRobot className="text-xs text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className="flex-1 min-w-0 overflow-x-hidden">
                      <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed font-medium overflow-x-hidden">{message.text}</p>
                      {/* Clickable navigation links for multiple candidates */}
                      {message.applications && Array.isArray(message.applications) && message.applications.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.applications.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                navigate(item.navigate);
                                // Don't close chatbot - keep chat data visible
                              }}
                              className="w-full px-4 py-2.5 text-white rounded-xl transition-all duration-300 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm hover:opacity-90"
                              style={{ backgroundColor: '#3A9188' }}
                            >
                              <span className="flex-1 text-left">
                                <span className="font-bold">{item.name}</span>
                              </span>
                              <span className="ml-2">🔗</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Clickable navigation link for single item */}
                      {message.navigate && !message.applications && (
                        <button
                          onClick={() => {
                            navigate(message.navigate);
                            // Don't close chatbot - keep chat data visible
                          }}
                          className="mt-3 w-full px-4 py-2.5 text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-semibold text-sm hover:opacity-90 cursor-pointer"
                          style={{ backgroundColor: '#3A9188' }}
                        >
                          <span>🔗 Go to {message.entityName || 'Page'}</span>
                        </button>
                      )}
                      
                      {/* Reaction Buttons for Bot Messages */}
                      {message.sender === 'bot' && !message.navigate && !message.applications && message.id !== 1 && (
                        <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setMessageReactions(prev => ({
                                ...prev,
                                [message.id]: prev[message.id] === 'like' ? null : 'like'
                              }));
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                              messageReactions[message.id] === 'like'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                            }`}
                            title="Helpful"
                          >
                            <FaThumbsUp className="text-xs" />
                          </button>
                          <button
                            onClick={() => {
                              setMessageReactions(prev => ({
                                ...prev,
                                [message.id]: prev[message.id] === 'dislike' ? null : 'dislike'
                              }));
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${
                              messageReactions[message.id] === 'dislike'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                            }`}
                            title="Not helpful"
                          >
                            <FaThumbsDown className="text-xs" />
                          </button>
                      </div>
                    )}
                    
                      {message.sender === 'bot' && (
                        <p className="text-xs mt-2 text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Animation Display - Only show when user has interacted */}
            {hasUserInteracted && isTyping && typingText && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 border border-gray-100 shadow-lg w-full overflow-x-hidden">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <FaRobot className="text-xs text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-x-hidden">
                      <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed font-medium text-gray-800 overflow-x-hidden">
                        {typingText}
                        <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ backgroundColor: '#3A9188' }}></span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Modern Typing Indicator - Responsive - Only show when user has interacted */}
            {hasUserInteracted && isLoading && !isTyping && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 border border-gray-100 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms', backgroundColor: '#3A9188' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms', backgroundColor: '#4CAF9F' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms', backgroundColor: '#2E7D6E' }}></div>
                    </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Modern Quick Actions - Responsive - Always at Bottom */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex-shrink-0" style={{ backgroundColor: '#F0FDFA' }}>
            <p className="text-xs font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full mr-2 animate-pulse shadow-sm" style={{ backgroundColor: '#3A9188' }}></span>
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {Object.entries(quickActionIcons).map(([action, IconComponent]) => (
                <button
                  key={action}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isLoading) {
                      handleQuickAction(action);
                    }
                  }}
                  disabled={isLoading}
                  className="group flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-3 sm:py-3.5 bg-white text-gray-700 rounded-xl hover:text-white transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 active:scale-95 border border-gray-100 hover:border-transparent backdrop-blur-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
                  style={{ 
                    pointerEvents: isLoading ? 'none' : 'auto',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#3A9188';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {React.createElement(IconComponent, { className: "text-sm sm:text-base group-hover:scale-110 transition-transform drop-shadow-sm pointer-events-none" })}
                  <span className="text-xs sm:text-sm font-semibold capitalize hidden sm:inline pointer-events-none">{action}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modern Input Area - Responsive */}
          <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-gray-100 bg-gradient-to-b from-white to-slate-50 relative">
            {/* Search History Dropdown */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50 scrollbar-hide">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaHistory className="text-sm text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Search History</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSearchHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
                <div className="py-2">
                  {searchHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setInput(item.query);
                        setShowSearchHistory(false);
                        inputRef.current?.focus();
                        // Trigger form submit to send the message
                        setTimeout(() => {
                          const form = inputRef.current?.closest('form');
                          if (form && !isLoading) {
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            form.dispatchEvent(submitEvent);
                          }
                        }, 100);
                      }}
                      className="w-full px-4 py-2.5 text-left transition-colors flex items-center space-x-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <FaClock className="text-xs text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.query}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <FaSearch className="text-xs text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchHistory([]);
                      localStorage.removeItem('chatbotSearchHistory');
                    }}
                    className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}
            
            {/* Auto-complete Dropdown */}
            {showAutoComplete && autoCompleteSuggestions.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 scrollbar-hide">
                {autoCompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      setShowAutoComplete(false);
                      inputRef.current?.focus();
                    }}
                      className="w-full px-4 py-2.5 text-left transition-colors flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0FDFA'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <FaSearch className="text-xs text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={(e) => {
                    if (autoCompleteSuggestions.length > 0) setShowAutoComplete(true);
                    e.currentTarget.style.borderColor = '#3A9188';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(58, 145, 136, 0.2)';
                  }}
                  onBlur={(e) => {
                    setTimeout(() => setShowAutoComplete(false), 200);
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  placeholder="Type your message..."
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-20 sm:pr-24 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 bg-white text-gray-900 text-sm sm:text-base transition-all duration-300 placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg"
                  disabled={isLoading}
                />
                {/* History Button */}
                {searchHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSearchHistory(!showSearchHistory);
                      setShowAutoComplete(false);
                    }}
                    className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#3A9188] transition-colors rounded-lg hover:bg-gray-100"
                    title="Search History"
                  >
                    <FaHistory className="text-sm" />
                  </button>
                )}
                {input.trim() && (
                  <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: '#3A9188' }}></div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                 className="px-5 py-3 sm:px-6 sm:py-4 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 disabled:hover:scale-100 disabled:hover:shadow-lg backdrop-blur-sm border border-white/20 hover:opacity-90"
                 style={{ backgroundColor: '#3A9188' }}
              >
                <FaPaperPlane className="text-sm sm:text-base drop-shadow-sm" />
              </button>
            </div>
            {input.trim() && (
              <p className="text-xs text-gray-400 mt-2 ml-1 hidden sm:block font-medium">
                Press Enter to send
              </p>
            )}
          </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

