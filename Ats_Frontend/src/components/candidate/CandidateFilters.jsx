import React from 'react';

const CandidateFilters = ({ onSearch, onStatusFilter, onLocationFilter, searchTerm, statusFilter, locationFilter }) => {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'NEW_CANDIDATE', label: 'New Candidate' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'INTERVIEWED', label: 'Interviewed' },
    { value: 'PLACED', label: 'Placed' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'NOT_INTERESTED', label: 'Not Interested' },
    { value: 'HOLD', label: 'Hold' },
    { value: 'HIGH_CTC', label: 'High CTC' },
    { value: 'DROPPED_BY_CLIENT', label: 'Dropped by Client' },
    { value: 'SUBMITTED_TO_CLIENT', label: 'Submitted to Client' },
    { value: 'NO_RESPONSE', label: 'No Response' },
    { value: 'IMMEDIATE', label: 'Immediate' },
    { value: 'REJECTED_BY_CLIENT', label: 'Rejected by Client' },
    { value: 'CLIENT_SHORTLIST', label: 'Client Shortlist' },
    { value: 'FIRST_INTERVIEW_SCHEDULED', label: 'First Interview Scheduled' },
    { value: 'FIRST_INTERVIEW_FEEDBACK_PENDING', label: 'First Interview Feedback Pending' },
    { value: 'FIRST_INTERVIEW_REJECT', label: 'First Interview Rejected' },
    { value: 'SECOND_INTERVIEW_SCHEDULED', label: 'Second Interview Scheduled' },
    { value: 'SECOND_INTERVIEW_FEEDBACK_PENDING', label: 'Second Interview Feedback Pending' },
    { value: 'SECOND_INTERVIEW_REJECT', label: 'Second Interview Rejected' },
    { value: 'THIRD_INTERVIEW_SCHEDULED', label: 'Third Interview Scheduled' },
    { value: 'THIRD_INTERVIEW_FEEDBACK_PENDING', label: 'Third Interview Feedback Pending' },
    { value: 'THIRD_INTERVIEW_REJECT', label: 'Third Interview Rejected' },
    { value: 'INTERNEL_REJECT', label: 'Internal Reject' },
    { value: 'CLIENT_REJECT', label: 'Client Reject' },
    { value: 'FINAL_SELECT', label: 'Final Select' },
    { value: 'JOINED', label: 'Joined' },
    { value: 'BACKEDOUT', label: 'Backed Out' },
    { value: 'NOT_RELEVANT', label: 'Not Relevant' }
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Bangalore', label: 'Bangalore' },
    { value: 'California', label: 'California' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Coimbatore', label: 'Coimbatore' },
    { value: 'Gurgaon', label: 'Gurgaon' },
    { value: 'Kochi', label: 'Kochi' },
    { value: 'Mysore', label: 'Mysore' },
    { value: 'Nagpur', label: 'Nagpur' },
    { value: 'Pune', label: 'Pune' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by candidate ID, name, email, phone, location, or skills..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-filter text-gray-400"></i>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-map-marker-alt text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by location..."
            value={locationFilter}
            onChange={(e) => onLocationFilter(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateFilters;
