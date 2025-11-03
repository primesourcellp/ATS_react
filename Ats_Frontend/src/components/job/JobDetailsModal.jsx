import React, { useState, useRef, useEffect } from "react";
import { jobStatus } from "../../api/api"; 

const JobDetailsModal = ({ job, onClose, onViewCandidates }) => {
  const [status, setStatus] = useState(job.status || "NOT_SELECTED");
  const [showRolesResponsibilities, setShowRolesResponsibilities] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollableRef = useRef(null);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const updatedJob = await jobStatus.updateStatus(job.id, newStatus);
      console.log("Job status updated:", updatedJob);
    } catch (error) {
      console.error("Failed to update job status:", error.message);
    }
  };

  const scrollToBottom = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({
        top: scrollableRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
        const isScrollable = scrollHeight > clientHeight;
        const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 50; // 50px threshold
        setShowScrollButton(isScrollable && isNotAtBottom);
      }
    };

    // Check immediately
    checkScrollable();
    
    // Check after a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkScrollable, 100);

    const container = scrollableRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollable);
    }

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        container.removeEventListener('scroll', checkScrollable);
      }
    };
  }, [showRolesResponsibilities, job]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose} // ✅ clicking outside closes modal
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()} // ✅ prevents modal from closing when clicking inside
      >
        {/* ===== Header ===== */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            <i className="fas fa-briefcase mr-2 text-blue-500"></i>
            Job Details
          </h3>

          {/* ✅ Status Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                status === "ACTIVE"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange("INACTIVE")}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                status === "INACTIVE"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Inactive
            </button>
            <button
              onClick={() => handleStatusChange("NOT_SELECTED")}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                status === "NOT_SELECTED"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Not Selected
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl ml-4"
          >
            &times;
          </button>
        </div>

        {/* ===== Job Info ===== */}
        <div className="p-6 relative" ref={scrollableRef} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Job Information
          </h4>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Job Title:</span>
              <p className="mt-1">{job.jobName || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Location:</span>
              <p className="mt-1">{job.jobLocation || "N/A"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Posted On:</span>
              <p className="mt-1">
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Client:</span>
              <p className="mt-1">{job.client?.clientName || "N/A"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Experience Level:</span>
              <p className="mt-1">{job.jobExperience || "Not specified"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Salary Range:</span>
              <p className="mt-1">{job.jobSalaryRange || "Not specified"}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-600">Job Description:</span>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {job.jobDescription || "No description available for this job."}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-600">
              Required Skills:
            </span>
            <div className="mt-1">
              {job.skillsName ? (
                <div className="flex flex-wrap gap-2">
                  {job.skillsName.split(',').map((skill, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">No skills specified</span>
              )}
            </div>
          </div>

          {/* Roles & Responsibilities Dropdown */}
          {job.rolesAndResponsibilities && (
            <div className="mb-4">
              <button
                onClick={() => setShowRolesResponsibilities(!showRolesResponsibilities)}
                className="flex items-center justify-between w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  <i className="fas fa-briefcase mr-2 text-blue-500"></i>
                  Roles & Responsibilities
                </span>
                <i className={`fas fa-chevron-${showRolesResponsibilities ? 'up' : 'down'} text-gray-500`}></i>
              </button>
              {showRolesResponsibilities && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {job.rolesAndResponsibilities}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-10"
              title="Scroll to bottom"
            >
              <i className="fas fa-arrow-down"></i>
            </button>
          )}
        </div>

        {/* ===== Footer ===== */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t">
          <button
            onClick={() => onViewCandidates(job)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <i className="fas fa-users mr-2"></i>
            View Candidates
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

export default JobDetailsModal;
