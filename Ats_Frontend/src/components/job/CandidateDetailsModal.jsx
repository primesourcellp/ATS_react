import { useEffect, useState } from "react";
import { candidateAPI } from "../../api/api";

const CandidateDetailsModal = ({ candidate, jobId, onClose }) => {
  const [resumeLoading, setResumeLoading] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState(candidate);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId && (!candidate.jobDTO || !candidate.job)) {
      loadCandidateDetails();
    } else {
      setLoading(false);
    }
  }, [candidate, jobId]);

  const loadCandidateDetails = async () => {
    try {
      setLoading(true);
      const details = await candidateAPI.getDetails(candidate.id, jobId);
      setCandidateDetails(details);
    } catch (error) {
      console.error("Error loading candidate details:", error);
      setCandidateDetails(candidate);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async () => {
    try {
      setResumeLoading(true);
      
      // Get the S3 presigned URL from backend
      const url = await candidateAPI.viewResume(candidateDetails.id);
      
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
      console.error("Failed to open resume:", error);
      alert("Could not open resume.");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      setResumeLoading(true);
      const response = await candidateAPI.downloadResume(candidateDetails.id);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidateDetails.name || "resume"}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download resume:", error);
      alert("Could not download resume.");
    } finally {
      setResumeLoading(false);
    }
  };

  const jobTitle =
    candidateDetails?.jobDTO?.jobName ||
    candidateDetails?.job?.jobName ||
    candidateDetails?.jobTitle ||
    "N/A";

  const jobLocation =
    candidateDetails?.jobDTO?.jobLocation ||
    candidateDetails?.job?.jobLocation ||
    candidateDetails?.jobLocation ||
    "N/A";

  const hasResume =
    candidateDetails.resumePdf && candidateDetails.resumePdf.length > 0;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading candidate details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <i className="fas fa-user text-blue-500"></i> Candidate Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold border-b pb-1">
              Personal Information
            </h4>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>{" "}
              <span>{candidateDetails.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>{" "}
              <span>{candidateDetails.email || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Phone:</span>{" "}
              <span>{candidateDetails.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>{" "}
              <span>{candidateDetails.status || "N/A"}</span>
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold border-b pb-1">
              Job Information
            </h4>
            <div className="flex justify-between">
              <span className="font-medium">Job Title:</span> <span>{jobTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Location:</span> <span>{jobLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Applied On:</span>{" "}
              <span>
                {candidateDetails.updatedAt
                  ? new Date(candidateDetails.updatedAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Professional Info */}
          {(candidateDetails.experience ||
            candidateDetails.currentCtc ||
            candidateDetails.expectedCtc ||
            candidateDetails.noticePeriod) && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold border-b pb-1">
                Professional Information
              </h4>
              {candidateDetails.experience && (
                <div className="flex justify-between">
                  <span className="font-medium">Experience:</span>{" "}
                  <span>{candidateDetails.experience}</span>
                </div>
              )}
              {candidateDetails.currentCtc && (
                <div className="flex justify-between">
                  <span className="font-medium">Current CTC:</span>{" "}
                  <span>{candidateDetails.currentCtc}</span>
                </div>
              )}
              {candidateDetails.expectedCtc && (
                <div className="flex justify-between">
                  <span className="font-medium">Expected CTC:</span>{" "}
                  <span>{candidateDetails.expectedCtc}</span>
                </div>
              )}
              {candidateDetails.noticePeriod && (
                <div className="flex justify-between">
                  <span className="font-medium">Notice Period:</span>{" "}
                  <span>{candidateDetails.noticePeriod}</span>
                </div>
              )}
            </div>
          )}

          {/* Resume */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold border-b pb-1">Resume</h4>
            <div className="flex justify-between items-center">
              <span className="font-medium">Resume Available:</span>
              <span>{hasResume ? "Yes" : "No"}</span>
            </div>

            {hasResume && (
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2"
                  onClick={handleViewResume}
                  disabled={resumeLoading}
                >
                  <i className="fas fa-eye"></i> {resumeLoading ? "Loading..." : "View Resume"}
                </button>
                <button
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center gap-2"
                  onClick={handleDownloadResume}
                  disabled={resumeLoading}
                >
                  <i className="fas fa-download"></i> {resumeLoading ? "Loading..." : "Download Resume"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center gap-2"
          >
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailsModal;
