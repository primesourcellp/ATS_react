import { useState } from 'react';
import { candidateAPI } from '../../api/api';

const CandidateDetails = ({ candidate, onClose, onEdit, onDelete }) => {
  const [resumeLoading, setResumeLoading] = useState(false);

  const handleViewResume = async () => {
    try {
      setResumeLoading(true);
      
      // Get the S3 presigned URL from backend
      const url = await candidateAPI.viewResume(candidate.id);
      
      // Open the S3 presigned URL directly in a new tab
      const newWindow = window.open(url, "_blank");
      
      // If popup was blocked, provide fallback
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked - create a clickable link
        if (confirm("Popup blocked. Click OK to open resume in current tab.")) {
          window.location.href = url;
        }
      }
      
    } catch (error) {
      alert(error.message || "Failed to view resume");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      setResumeLoading(true);
      const resumeBlob = await candidateAPI.downloadResume(candidate.id);
      const blobUrl = URL.createObjectURL(resumeBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Candidate_${candidate.id}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert(error.message || "Failed to download resume");
    } finally {
      setResumeLoading(false);
    }
  };

  // Get job names with client information from applications
  let jobNames = 'N/A';
  if (candidate.jobCount && candidate.jobCount > 0) {
    if (candidate.appliedJobsWithClient && candidate.appliedJobsWithClient.length > 0) {
      jobNames = candidate.appliedJobsWithClient.map(job => `${job.jobName} (${job.clientName})`).join(', ');
    } else if (candidate.appliedJobs && candidate.appliedJobs.length > 0) {
      jobNames = candidate.appliedJobs.join(', ');
    } else {
      jobNames = `${candidate.jobCount} job(s) applied`;
    }
  }

  const getStatusClass = (status) => {
    const statusClassMap = {
      'NEW_CANDIDATE': 'bg-emerald-100 text-emerald-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'INTERVIEWED': 'bg-purple-100 text-purple-800',
      'PLACED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'SUBMITTED_BY_CLIENT': 'bg-indigo-100 text-indigo-800',
      'CLIENT_SHORTLIST': 'bg-teal-100 text-teal-800',
      'FIRST_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'FIRST_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'FIRST_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'SECOND_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'SECOND_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'SECOND_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'THIRD_INTERVIEW_SCHEDULED': 'bg-blue-100 text-blue-800',
      'THIRD_INTERVIEW_FEEDBACK_PENDING': 'bg-orange-100 text-orange-800',
      'THIRD_INTERVIEW_REJECT': 'bg-red-100 text-red-800',
      'INTERNEL_REJECT': 'bg-red-100 text-red-800',
      'CLIENT_REJECT': 'bg-red-100 text-red-800',
      'FINAL_SELECT': 'bg-green-100 text-green-800',
      'JOINED': 'bg-green-100 text-green-800',
      'BACKEDOUT': 'bg-gray-100 text-gray-800'
    };
    return statusClassMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose} // click outside closes modal
    >
      {/* White card */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Candidate Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            &times;
          </button>
        </div>

        {/* Candidate Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{candidate.name || 'N/A'}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
            <span><i className="fas fa-envelope mr-2"></i> {candidate.email || 'N/A'}</span>
            <span><i className="fas fa-phone mr-2"></i> {candidate.phone || 'N/A'}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(candidate.status)}`}>
                {candidate.status || 'N/A'}
              </span>
            </div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Job</label><p>{jobNames}</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Skills</label><p>{candidate.skills || 'N/A'}</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Experience</label><p>{candidate.experience || 'N/A'} years</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label><p>{candidate.noticePeriod || 'N/A'} days</p></div>
          </div>
          <div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Current CTC</label><p>{candidate.currentCtc || 'N/A'} LPA</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Expected CTC</label><p>{candidate.expectedCtc || 'N/A'} LPA</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><p>{candidate.location || 'N/A'}</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label><p>{candidate.updatedAt ? new Date(candidate.updatedAt).toLocaleString() : 'N/A'}</p></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Resume</label><p className={candidate.hasResume ? 'text-green-600' : 'text-red-600'}>{candidate.hasResume ? 'Available' : 'Not Uploaded'}</p></div>
          </div>
        </div>

        {/* About */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
          <p className="text-gray-900 whitespace-pre-wrap">{candidate.about || 'N/A'}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleViewResume} disabled={!candidate.hasResume || resumeLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
            {resumeLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-file-pdf mr-2"></i>}
            View Resume
          </button>
          <button onClick={handleDownloadResume} disabled={!candidate.hasResume || resumeLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50">
            {resumeLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-download mr-2"></i>}
            Download Resume
          </button>
          <button onClick={onEdit} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center">
            <i className="fas fa-edit mr-2"></i>Edit
          </button>
          <button onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center">
            <i className="fas fa-trash mr-2"></i>Delete
          </button>
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
            <i className="fas fa-arrow-left mr-2"></i>Back to List
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
