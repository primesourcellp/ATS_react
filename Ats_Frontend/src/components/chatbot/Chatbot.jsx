import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaBriefcase, FaUserTie, FaFileAlt, FaCalendarAlt, FaThumbsUp, FaThumbsDown, FaSearch } from 'react-icons/fa';
import { chatbotAPI } from '../../api/chatbotApi';
import { jobAPI, candidateAPI, applicationAPI, interviewAPI, clientAPI } from '../../api/api';

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for the ATS dashboard.\n\nI provide quick insights on:\n• Candidate data summaries\n• Pending actions and follow-ups\n• Interview schedules\n• New applications\n• Missing documents\n\nHow can I assist you today?",
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
        'schedule interview', 'application status', 'shortlisted'
      ].filter(s => s.toLowerCase().includes(input.toLowerCase().trim()));
      setAutoCompleteSuggestions(suggestions.slice(0, 5));
      setShowAutoComplete(suggestions.length > 0);
    } else {
      setAutoCompleteSuggestions([]);
      setShowAutoComplete(false);
    }
  }, [input]);


  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
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
    
    // Check for status in various formats
    for (const [key, value] of Object.entries(statusMap)) {
      if (lowerMessage === key || lowerMessage === value.toLowerCase() || 
          lowerMessage === `candidates ${key}` || lowerMessage === `${key} candidates` ||
          lowerMessage === `show ${key}` || lowerMessage === `list ${key}` ||
          lowerMessage === `${key} status` || lowerMessage === `status ${key}`) {
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

    // If status detected, fetch and display candidates
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
        
        // Format experience
        const formatExperience = (exp) => {
          if (!exp) return 'Not specified';
          if (typeof exp === 'string' && exp.toLowerCase().includes('year')) return exp;
          return `${exp} years`;
        };
        
        // Build response with candidate list
        let response = `📋 CANDIDATES WITH STATUS: ${statusDisplayName || formatStatus(detectedStatus)}\n\n`;
        response += `\n`;
        response += `Total Found: ${candidatesArray.length} candidate${candidatesArray.length !== 1 ? 's' : ''}\n\n`;
        
        // Show detailed information for each candidate
        candidatesArray.slice(0, 20).forEach((candidate, index) => {
          response += `${index + 1}. ${candidate.name || 'Unknown'}\n`;
          response += `\n`;
          response += `📧 Email: ${candidate.email || 'N/A'}\n`;
          response += `📞 Phone: ${candidate.phone || 'N/A'}\n`;
          response += `📋 Status: ${formatStatus(candidate.status)}\n`;
          
          if (candidate.experience) {
            response += `💼 Experience: ${formatExperience(candidate.experience)}\n`;
          }
          if (candidate.skills) {
            response += `🛠️ Skills: ${candidate.skills}\n`;
          }
          if (candidate.currentCtc) {
            response += `💰 Current CTC: ${candidate.currentCtc} LPA\n`;
          }
          if (candidate.expectedCtc) {
            response += `💰 Expected CTC: ${candidate.expectedCtc} LPA\n`;
          }
          if (candidate.noticePeriod) {
            response += `📅 Notice Period: ${candidate.noticePeriod} days\n`;
          }
          if (candidate.resumePath || candidate.resumeUrl) {
            response += `📄 Resume: ✅ Available\n`;
          } else {
            response += `📄 Resume: ❌ Not uploaded\n`;
          }
          
          response += `\n`;
        });
        
        if (candidatesArray.length > 20) {
          response += `... and ${candidatesArray.length - 20} more candidate${candidatesArray.length - 20 !== 1 ? 's' : ''} with this status.\n`;
        }
        
        return response;
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
            
            // Format experience
            const formatExperience = (exp) => {
              if (!exp) return 'Not specified';
              if (typeof exp === 'string' && exp.toLowerCase().includes('year')) return exp;
              return `${exp} years`;
            };
            
            // Build response with candidate list
            let response = `📋 CANDIDATES WITH STATUS: ${statusDisplayName || formatStatus(detectedStatus)}\n\n`;
            response += `\n`;
            response += `Total Found: ${candidatesArray.length} candidate${candidatesArray.length !== 1 ? 's' : ''}\n\n`;
            
            // Show detailed information for each candidate
            candidatesArray.slice(0, 20).forEach((candidate, index) => {
              response += `${index + 1}. ${candidate.name || 'Unknown'}\n`;
              response += `\n`;
              response += `📧 Email: ${candidate.email || 'N/A'}\n`;
              response += `📞 Phone: ${candidate.phone || 'N/A'}\n`;
              response += `📋 Status: ${formatStatus(candidate.status)}\n`;
              
              if (candidate.experience) {
                response += `💼 Experience: ${formatExperience(candidate.experience)}\n`;
              }
              if (candidate.skills) {
                response += `🛠️ Skills: ${candidate.skills}\n`;
              }
              if (candidate.currentCtc) {
                response += `💰 Current CTC: ${candidate.currentCtc} LPA\n`;
              }
              if (candidate.expectedCtc) {
                response += `💰 Expected CTC: ${candidate.expectedCtc} LPA\n`;
              }
              if (candidate.noticePeriod) {
                response += `📅 Notice Period: ${candidate.noticePeriod} days\n`;
              }
              if (candidate.resumePath || candidate.resumeUrl) {
                response += `📄 Resume: ✅ Available\n`;
              } else {
                response += `📄 Resume: ❌ Not uploaded\n`;
              }
              
              response += `\n`;
            });
            
            if (candidatesArray.length > 20) {
              response += `... and ${candidatesArray.length - 20} more candidate${candidatesArray.length - 20 !== 1 ? 's' : ''} with this status.\n`;
            }
            
            return response;
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
      return "Hello. I'm your AI assistant for the ATS dashboard.\n\nI provide quick insights on candidate data, pending actions, interview schedules, new applications, and missing documents.\n\nHow can I assist you?";
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
    setIsLoading(true);
    
    try {
      let response = '';
      
      if (action === 'candidates') {
        try {
          const count = await candidateAPI.getCount();
          response = `📊 CANDIDATES OVERVIEW\n\nTotal Candidates: ${count}\n🔗 Would you like to see the full list? Type "list candidates" or I can navigate you to the Candidates page.`;
        } catch {
          const candidates = await candidateAPI.getAll();
          const count = Array.isArray(candidates) ? candidates.length : 0;
          response = `📊CANDIDATES OVERVIEW\n\nTotal Candidates: ${count}\n🔗 Would you like to see the full list? Type "list candidates" or I can navigate you to the Candidates page.`;
        }
      } else if (action === 'jobs') {
        const jobs = await jobAPI.getAll();
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        const activeJobs = jobsArray.filter(job => {
          const status = job?.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'OPEN';
        });
      response = `📊JOBS OVERVIEW\n\nTotal Jobs: ${jobsArray.length}\nActive Jobs: ${activeJobs.length}\n🔗 Would you like to see the full list? Type "list jobs" or I can navigate you to the Jobs page.`;
      } else if (action === 'applications') {
        try {
          const count = await applicationAPI.getCount();
          response = `📊APPLICATIONS OVERVIEW\n\nTotal Applications: ${count}\n🔗 Would you like to see the full list? Type "list applications" or I can navigate you to the Applications page.`;
        } catch {
          const applications = await applicationAPI.getAll();
          const count = Array.isArray(applications) ? applications.length : 0;
          response = `📊APPLICATIONS OVERVIEW\n\nTotal Applications: ${count}\n🔗 Would you like to see the full list? Type "list applications" or I can navigate you to the Applications page.`;
        }
      } else if (action === 'interviews') {
        try {
          const count = await interviewAPI.getCount();
          response = `📊INTERVIEWS OVERVIEW\n\nTotal Interviews: ${count}\n🔗 Would you like to see today's interviews? Type "show interviews today" or I can navigate you to the Interviews page.`;
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
          response = `📊INTERVIEWS OVERVIEW\n\nTotal Interviews: ${interviewsArray.length}\nToday's Interviews: ${todayInterviews.length}\n🔗 Would you like to see today's interviews? Type "show interviews today" or I can navigate you to the Interviews page.`;
        }
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date()
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
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95 group backdrop-blur-sm border-2 border-white/20 p-0"
          aria-label="Open chatbot"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
          
          {/* Icon container */}
          <div className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300">
            <FaRobot className="text-xl sm:text-2xl drop-shadow-lg" />
          </div>
          
          {/* Status indicator */}
          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1">
            <div className="relative">
              <span className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border border-white animate-ping"></span>
              <span className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border border-white shadow-md"></span>
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
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Chat Window - Responsive */}
      {isOpen && (
        <div 
          className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[700px] h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden backdrop-blur-xl bg-white/95 chatbot-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modern Header - Responsive */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-3 sm:p-4 rounded-t-3xl flex items-center justify-between relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 relative z-10 flex-1">
              {/* Avatar with glow effect */}
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl transform hover:scale-105 transition-transform">
                  <FaRobot className="text-base sm:text-lg drop-shadow-lg" />
                </div>
                {/* Status badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border border-white shadow-md animate-pulse"></span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-emerald-400/30 rounded-2xl blur-xl animate-pulse"></div>
              </div>
              
              {/* Title and status */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl drop-shadow-sm">ATS Assistant</h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-sm"></span>
                  <p className="text-xs sm:text-sm text-white/90 font-medium truncate">Online • Ready to help</p>
                </div>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90 hover:scale-110 relative z-10 backdrop-blur-sm border border-white/20"
              aria-label="Close chatbot"
            >
              <FaTimes className="text-lg sm:text-xl" />
            </button>
          </div>

          {/* Modern Messages Container - Responsive */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-50 scrollbar-hide">
            {messages.map((message, index) => (
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
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
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
                                setIsOpen(false);
                              }}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
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
                            setIsOpen(false);
                          }}
                          className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                        >
                          <span>🔗 View Details</span>
                        </button>
                      )}
                      
                      {/* Reaction Buttons for Bot Messages */}
                      {message.sender === 'bot' && !message.navigate && !message.applications && (
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
            
            {/* Typing Animation Display */}
            {isTyping && typingText && (
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
                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Modern Typing Indicator - Responsive */}
            {isLoading && !isTyping && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 border border-gray-100 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Modern Quick Actions - Responsive */}
          {messages.length === 1 && (
            <div className="px-4 sm:px-6 py-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse shadow-sm"></span>
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(quickActionIcons).map(([action, IconComponent]) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="group flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-3 sm:py-3.5 bg-white text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 border border-gray-100 hover:border-transparent backdrop-blur-sm"
                  >
                    {React.createElement(IconComponent, { className: "text-sm sm:text-base group-hover:scale-110 transition-transform drop-shadow-sm" })}
                    <span className="text-xs sm:text-sm font-semibold capitalize hidden sm:inline">{action}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modern Input Area - Responsive */}
          <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-gray-100 bg-gradient-to-b from-white to-slate-50 relative">
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
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
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
                  onFocus={() => {
                    if (autoCompleteSuggestions.length > 0) setShowAutoComplete(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowAutoComplete(false), 200);
                  }}
                  placeholder="Type your message..."
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm sm:text-base transition-all duration-300 placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg"
                  disabled={isLoading}
                />
                {input.trim() && (
                  <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 disabled:hover:scale-100 disabled:hover:shadow-lg backdrop-blur-sm border border-white/20"
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
      )}
    </>
  );
};

export default Chatbot;

