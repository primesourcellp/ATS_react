// components/ApplicationDetailCard.jsx
import React from "react";
import { websiteApplicationAPI } from "../../api/websiteapi";

const ApplicationDetailCard = ({ application, onClose, formatDate }) => {
  if (!application) return null;

  const handleViewResume = async () => {
    try {
      const resumeUrl = await websiteApplicationAPI.viewResume(application.id);
      window.open(resumeUrl, '_blank');
    } catch (error) {
      console.error('Error viewing resume:', error);
      alert('Failed to view resume: ' + error.message);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const blob = await websiteApplicationAPI.downloadResume(application.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_${application.applierName}_${application.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume: ' + error.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose} // ✅ close modal when clicking outside
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Application Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Candidate Info */}
            <div>
              <h4 className="font-medium text-gray-700">Candidate Information</h4>
              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Name:</span> {application.applierName}</p>
                <p><span className="font-semibold">Email:</span> {application.email}</p>
                <p><span className="font-semibold">Phone:</span> {application.phoneNumber || 'N/A'}</p>
                <p><span className="font-semibold">Location:</span> {application.currentLocation || 'N/A'}</p>
              </div>
            </div>

            {/* Job Info */}
            <div>
              <h4 className="font-medium text-gray-700">Job Information</h4>
              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Job:</span> {application.jobName || 'N/A'}</p>
                <p><span className="font-semibold">Applied At:</span> {formatDate(application.appliedAt)}</p>
                <p>
                  <span className="font-semibold">Client Name:</span>{" "}
                  <span className="text-blue-600 font-bold bg-yellow-100 px-1 rounded">
                    {application.clientName || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-gray-700">Professional Information</h4>
              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Currently Working:</span> {application.currentlyWorking || 'N/A'}</p>
                {application.currentlyWorking === 'YES' && (
                  <>
                    <p><span className="font-semibold">Current CTC:</span> {application.currentCtc || 'N/A'}</p>
                    <p><span className="font-semibold">Company:</span> {application.workingCompanyName || 'N/A'}</p>
                    <p><span className="font-semibold">Role:</span> {application.workRole || 'N/A'}</p>
                  </>
                )}
                <p><span className="font-semibold">Total Experience:</span> {application.totalExperience || '0'} years</p>
              </div>
            </div>

            {/* Skills & Resume */}
            <div>
              <h4 className="font-medium text-gray-700">Skills & Resume</h4>
              <div className="mt-2 space-y-2">
                <p><span className="font-semibold">Skills:</span> {application.skills || 'N/A'}</p>
                {application.resumePath && (
                  <div>
                    <span className="font-semibold">Resume:</span>
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={handleViewResume}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <i className="fas fa-eye mr-1"></i>View Resume
                      </button>
                      <button
                        onClick={handleDownloadResume}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        <i className="fas fa-download mr-1"></i>Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailCard;
