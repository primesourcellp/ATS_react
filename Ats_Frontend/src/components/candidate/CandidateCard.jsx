import React from 'react';

const CandidateCard = ({ candidate, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    const statusColors = {
      'NEW_CANDIDATE': 'bg-emerald-100 text-emerald-800',
      'SCHEDULED': 'bg-yellow-100 text-yellow-800',
      'INTERVIEWED': 'bg-blue-100 text-blue-800',
      'PLACED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{candidate.name}</h3>
            <p className="text-gray-600 text-sm">{candidate.email}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
            {candidate.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-phone-alt mr-2 w-4"></i>
            <span>{candidate.phone || 'Not provided'}</span>
          </div>
          
          {candidate.skills && (
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-tools mr-2 w-4"></i>
              <span className="truncate">{candidate.skills}</span>
            </div>
          )}

          {candidate.experience && (
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-briefcase mr-2 w-4"></i>
              <span>{candidate.experience} years experience</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              <i className="fas fa-edit mr-1"></i> Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              <i className="fas fa-trash mr-1"></i> Delete
            </button>
          </div>
          
          {candidate.hasResume && (
            <button className="text-blue-500 hover:text-blue-700 text-sm">
              <i className="fas fa-file-pdf mr-1"></i> Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;