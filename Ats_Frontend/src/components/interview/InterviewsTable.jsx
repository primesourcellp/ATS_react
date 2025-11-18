import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewsTable = ({ interviews, loading, onEditInterview, onDeleteInterview, onBulkAction }) => {
  const navigate = useNavigate();
  const [expandedInterviewId, setExpandedInterviewId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterviews, setSelectedInterviews] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'interviewDate', direction: 'ascending' });

  const toggleExpand = (interviewId) => {
    setExpandedInterviewId(expandedInterviewId === interviewId ? null : interviewId);
  };

  const toggleSelectInterview = (interviewId) => {
    if (selectedInterviews.includes(interviewId)) {
      setSelectedInterviews(selectedInterviews.filter(id => id !== interviewId));
    } else {
      setSelectedInterviews([...selectedInterviews, interviewId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInterviews.length === filteredInterviews.length && filteredInterviews.length > 0) {
      setSelectedInterviews([]);
    } else {
      setSelectedInterviews(filteredInterviews.map(interview => interview.id));
    }
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (isNaN(start) || isNaN(end)) return 'N/A';
      
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHrs > 0 && diffMins > 0) {
        return `${diffHrs}h ${diffMins}m`;
      } else if (diffHrs > 0) {
        return `${diffHrs}h`;
      } else {
        return `${diffMins}m`;
      }
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to extract candidate name
  const getCandidateName = (interview) => {
    if (interview.candidateName) return interview.candidateName;
    if (interview.application?.candidate?.name) return interview.application.candidate.name;
    if (interview.candidate?.name) return interview.candidate.name;
    return 'N/A';
  };

  // Helper function to extract candidate ID
  const getCandidateId = (interview) => {
    // First check if candidateId is directly available
    if (interview.candidateId) return interview.candidateId;
    // Fallback to nested structures
    if (interview.application?.candidate?.id) return interview.application.candidate.id;
    if (interview.candidate?.id) return interview.candidate.id;
    return null;
  };

  const handleViewCandidate = (interview) => {
    const candidateId = getCandidateId(interview);
    if (candidateId) {
      navigate(`/candidates/${candidateId}`);
    } else {
      console.warn('Candidate ID not found for interview:', interview);
    }
  };

  // Helper function to extract job title
  const getJobTitle = (interview) => {
    if (interview.jobTitle) return interview.jobTitle;
    if (interview.application?.job?.title) return interview.application.job.title;
    if (interview.application?.job?.jobName) return interview.application.job.jobName;
    if (interview.job?.title) return interview.job.title;
    if (interview.job?.jobName) return interview.job.jobName;
    return 'N/A';
  };

  // Helper function to extract client name
  const getClientName = (interview) => {
    if (interview.clientName) return interview.clientName;
    if (interview.application?.job?.client?.name) return interview.application.job.client.name;
    if (interview.job?.client?.name) return interview.job.client.name;
    if (interview.client?.name) return interview.client.name;
    return 'N/A';
  };

  // Helper function to get interview status with appropriate styling
  const getInterviewStatus = (interview) => {
    const now = new Date();
    const interviewDate = new Date(`${interview.interviewDate}T${interview.interviewTime}`);
    const endTime = new Date(`${interview.interviewDate}T${interview.endTime}`);
    
    if (interview.status === 'COMPLETED') {
      return { text: 'Completed', class: 'bg-green-100 text-green-800' };
    } else if (interview.status === 'CANCELLED') {
      return { text: 'Cancelled', class: 'bg-red-100 text-red-800' };
    } else if (now > endTime) {
      return { text: 'Completed', class: 'bg-green-100 text-green-800' };
    } else if (now >= interviewDate && now <= endTime) {
      return { text: 'In Progress', class: 'bg-blue-100 text-blue-800' };
    } else if (now < interviewDate) {
      return { text: 'Scheduled', class: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { text: 'Scheduled', class: 'bg-yellow-100 text-yellow-800' };
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort interviews
  const sortedInterviews = useMemo(() => {
    let sortableItems = [...interviews];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle date sorting
        if (sortConfig.key === 'interviewDate') {
          const dateA = new Date(a.interviewDate);
          const dateB = new Date(b.interviewDate);
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }
        
        // Handle time sorting
        if (sortConfig.key === 'interviewTime') {
          const timeA = new Date(`2000-01-01T${a.interviewTime}`);
          const timeB = new Date(`2000-01-01T${b.interviewTime}`);
          return sortConfig.direction === 'ascending' ? timeA - timeB : timeB - timeA;
        }
        
        // Handle status sorting
        if (sortConfig.key === 'status') {
          const statusA = getInterviewStatus(a).text;
          const statusB = getInterviewStatus(b).text;
          if (statusA < statusB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (statusA > statusB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
        
        // Default sorting
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [interviews, sortConfig]);

  // Filter interviews based on status, date, and search term
  const filteredInterviews = useMemo(() => {
    return sortedInterviews.filter(interview => {
      const statusMatch = statusFilter === 'ALL' || getInterviewStatus(interview).text === statusFilter;
      
      // Date filtering
      let dateMatch = true;
      if (dateFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        dateMatch = interview.interviewDate === today;
      } else if (dateFilter === 'UPCOMING') {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        dateMatch = (interview.interviewDate > today || 
          (interview.interviewDate === today && new Date(`${interview.interviewDate}T${interview.interviewTime}`) > now));
      } else if (dateFilter === 'PAST') {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        dateMatch = (interview.interviewDate < today || 
          (interview.interviewDate === today && new Date(`${interview.interviewDate}T${interview.endTime}`) < now));
      }
      
      // Search filtering
      const lowerSearch = searchTerm.toLowerCase();
      const searchMatch = searchTerm === '' || 
        getCandidateName(interview).toLowerCase().includes(lowerSearch) ||
        getJobTitle(interview).toLowerCase().includes(lowerSearch) ||
        getClientName(interview).toLowerCase().includes(lowerSearch) ||
        (interview.interviewer && interview.interviewer.toLowerCase().includes(lowerSearch)) ||
        (interview.id && interview.id.toString().toLowerCase().includes(lowerSearch));
      
      return statusMatch && dateMatch && searchMatch;
    });
  }, [sortedInterviews, statusFilter, dateFilter, searchTerm]);

  // Group interviews by date for calendar view
  const interviewsByDate = useMemo(() => {
    return filteredInterviews.reduce((acc, interview) => {
      const date = interview.interviewDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(interview);
      return acc;
    }, {});
  }, [filteredInterviews]);

  // Calendar view component
  const CalendarView = () => {
    const dates = Object.keys(interviewsByDate).sort();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {dates.map(date => (
          <div key={date} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {interviewsByDate[date].map(interview => {
                const statusInfo = getInterviewStatus(interview);
                const duration = calculateDuration(interview.interviewTime, interview.endTime);
                
                return (
                  <div key={interview.id} className="p-3 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <button
                          onClick={() => handleViewCandidate(interview)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                          {getCandidateName(interview)}
                        </button>
                        <div className="text-xs text-gray-500 mt-1">{getJobTitle(interview)}</div>
                        <div className="text-xs text-gray-500 mt-1">Client: {getClientName(interview)}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {interview.id}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {interview.interviewTime} - {interview.endTime} • {duration} • {interview.interviewer || 'No interviewer'}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => onEditInterview(interview)}
                        className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50 transition-colors"
                        title="Edit Interview"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteInterview(interview.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete Interview"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading interview schedules...</p>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Interviews Scheduled</h3>
        <p className="text-gray-500 max-w-md mx-auto">Schedule new interviews or try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with filters and view options */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by candidate, job, or interview ID..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="PAST">Past</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'table' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'calendar' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600'}`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Candidate & Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('interviewDate')}
                  >
                    <div className="flex items-center">
                      Date & Time
                      {sortConfig.key === 'interviewDate' && (
                        <svg className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Duration
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        <svg className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterviews.map((interview, index) => {
                  const statusInfo = getInterviewStatus(interview);
                  const candidateName = getCandidateName(interview);
                  const jobTitle = getJobTitle(interview);
                  const clientName = getClientName(interview);
                  const duration = calculateDuration(interview.interviewTime, interview.endTime);
                  
                  
                  
                  return (
                    <React.Fragment key={interview.id}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCandidate(interview);
                              }}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline truncate block"
                            >
                              {candidateName}
                            </button>
                            <div className="text-sm text-gray-600 truncate">{jobTitle}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {interview.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{clientName}</div>
                        </td>
                        

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{interview.interviewDate}</div>
                          <div className="text-sm text-gray-600">{interview.interviewTime} - {interview.endTime}</div>
                          {/* <div className="text-xs text-gray-500 mt-1">{duration}</div> */}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{duration}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onEditInterview(interview)}
                              className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50 transition-colors"
                              title="Edit Interview"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteInterview(interview.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete Interview"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleExpand(interview.id)}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
                              title={expandedInterviewId === interview.id ? "Collapse" : "Expand"}
                            >
                              <svg 
                                className={`w-5 h-5 transform transition-transform ${expandedInterviewId === interview.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedInterviewId === interview.id && (
                        <tr className="bg-green-50">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Interview Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="text-gray-600">Interviewer:</div>
                                  <div className="text-gray-900 font-medium">{interview.interviewer || 'Not specified'}</div>
                                  
                                  <div className="text-gray-600">Type:</div>
                                  <div className="text-gray-900 font-medium">{interview.interviewType || 'General'}</div>
                                  
                                  <div className="text-gray-600">Location:</div>
                                  <div className="text-gray-900 font-medium">{interview.location || 'Not specified'}</div>
                                  
                                  <div className="text-gray-600">Duration:</div>
                                  <div className="text-gray-900 font-medium">{duration}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
                                <div className="text-sm text-gray-600">
                                  {interview.notes || 'No additional notes provided.'}
                                </div>
                                {interview.meetingLink && (
                                  <div className="mt-2">
                                    <a 
                                      href={interview.meetingLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                      </svg>
                                      Join Meeting
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer with summary */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredInterviews.length}</span> of <span className="font-medium">{interviews.length}</span> interviews
              </p>
              {(statusFilter !== 'ALL' || dateFilter !== 'ALL' || searchTerm !== '') && (
                <button 
                  className="text-sm text-green-600 hover:text-green-800"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setDateFilter('ALL');
                    setSearchTerm('');
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InterviewsTable;