import React from "react";

const CandidateModal = ({ candidate, onClose, onViewResume }) => {
  if (!candidate) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose} // close modal when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()} // stop closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Candidate: {candidate.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          {[
            ["Name", candidate.name],
            ["Email", candidate.email],
            ["Phone", candidate.phone],
            ["Skills", candidate.skills],
            ["Experience", candidate.experience],
            ["Current CTC", candidate.currentCtc],
            ["Expected CTC", candidate.expectedCtc],
            ["Notice Period", candidate.noticePeriod],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="font-medium text-gray-600">{label}:</span>
              <span className="text-gray-800">{value || "-"}</span>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Status:</span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                candidate.status?.toLowerCase() === "active"
                  ? "bg-green-100 text-green-800"
                  : candidate.status?.toLowerCase() === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : candidate.status?.toLowerCase() === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {candidate.status || "Active"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onViewResume}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <i className="fas fa-file-pdf"></i>
            <span>View Resume</span>
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateModal;
