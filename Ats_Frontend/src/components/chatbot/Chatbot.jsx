import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCommentDots, FaTimes, FaPaperPlane, FaSearch, FaHistory, FaClock, FaPlus, FaBars, FaTrash } from 'react-icons/fa';
import { chatbotAPI } from '../../api/chatbotApi';

const Chatbot = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Recruiter';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
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
    if (currentChatId && messages.length > 0) {
      const chatData = {
        id: currentChatId,
        messages: messages,
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
  }, [messages, currentChatId]);

  // Create new chat
  const handleNewChat = () => {
    // Save current chat if it has messages
    if (currentChatId && messages.length > 0) {
      const chatData = {
        id: currentChatId,
        messages: messages,
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
    setMessages([]);
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
    setMessages([]);
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
    // All processing is now done by OpenAI backend - just send the message
    try {
      const response = await chatbotAPI.sendMessage(message);
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return `I encountered an error: ${error.message || 'Unknown error'}. Please try again.`;
    }
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
          <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
            <FaCommentDots className="text-xl sm:text-2xl drop-shadow-lg" />
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

      {/* Modern Chat Window - Responsive */}
      {isOpen && (
        <div 
          className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[700px] h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl flex z-50 border border-gray-100 overflow-hidden chatbot-container"
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
                  <p>No chat history yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleLoadChat(chat.id)}
                      className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-[#3A9188] line-clamp-1">
                          {chat.title || 'Untitled Chat'}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id, e);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                          title="Delete chat"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="text-xs" />
                        <span>{new Date(chat.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {chat.messages?.filter(m => m.sender === 'user').length || 0} messages
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-[#3A9188] to-[#2E7D6E] text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChatSidebar(!showChatSidebar)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Toggle chat history"
                >
                  <FaBars className="text-lg" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">ATS Assistant</h2>
                  <p className="text-xs sm:text-sm text-white/80">Powered by OpenAI</p>
                </div>
              </div>
              <button
                onClick={handleCloseChatbot}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Close chatbot"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50 via-white to-gray-50">
              {messages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#3A9188]/10 to-[#2E7D6E]/10 mb-6">
                    <FaCommentDots className="text-4xl text-[#3A9188] animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a conversation</h3>
                  <p className="text-sm text-gray-500 text-center max-w-xs">Ask me anything about your ATS system or general questions</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {message.sender === 'bot' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#3A9188] to-[#2E7D6E] flex items-center justify-center shadow-md">
                      <FaCommentDots className="text-sm text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-[#3A9188] to-[#2E7D6E] text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md hover:shadow-md'
                    }`}
                  >
                    <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                    {message.navigate && (
                      <button
                        onClick={() => {
                          navigate(message.navigate);
                        }}
                        className="mt-3 px-4 py-2 bg-white text-[#3A9188] rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium shadow-sm"
                      >
                        Go to {message.entityName || 'Page'}
                      </button>
                    )}
                    <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
                      <span className="text-sm text-white font-semibold">{username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#3A9188] to-[#2E7D6E] flex items-center justify-center shadow-md">
                    <FaCommentDots className="text-sm text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#3A9188] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#3A9188] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 bg-[#3A9188] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 sm:p-6 border-t border-gray-200 bg-white relative shadow-lg">
              {/* Search History Dropdown */}
              {showSearchHistory && searchHistory.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50 scrollbar-hide">
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <span className="text-xs font-semibold text-gray-600">Recent Searches</span>
                      <button
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('chatbotSearchHistory');
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>
                    {searchHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setInput(item.query);
                          setShowSearchHistory(false);
                          handleSend({ preventDefault: () => {}, target: { value: item.query } });
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-700 flex items-center gap-2"
                      >
                        <FaSearch className="text-xs text-gray-400" />
                        <span className="text-sm text-gray-700">{item.query}</span>
                      </button>
                    ))}
                  </div>
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
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 pr-20 sm:pr-24 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3A9188]/20 focus:border-[#3A9188] bg-white text-gray-900 text-sm sm:text-base transition-all duration-300 placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg"
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
