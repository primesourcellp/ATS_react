import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { applicationAPI, candidateAPI, interviewAPI, jobAPI } from "../../api/api";
import InterviewModal from "./InterviewModal";
import ApplicationModal from "./ApplicationModal";
import DeleteConfirmationModal from "../client/DeleteConfirmationModal";

const statusClassMap = {
  NEW_CANDIDATE: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  INTERVIEWED: "bg-purple-100 text-purple-800",
  PLACED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  NOT_INTERESTED: "bg-gray-100 text-gray-800",
  HOLD: "bg-amber-100 text-amber-800",
  HIGH_CTC: "bg-rose-100 text-rose-800",
  DROPPED_BY_CLIENT: "bg-red-100 text-red-800",
  SUBMITTED_TO_CLIENT: "bg-indigo-100 text-indigo-800",
  NO_RESPONSE: "bg-orange-100 text-orange-800",
  IMMEDIATE: "bg-emerald-100 text-emerald-800",
  REJECTED_BY_CLIENT: "bg-rose-100 text-rose-700",
  CLIENT_SHORTLIST: "bg-teal-100 text-teal-800",
  FIRST_INTERVIEW_SCHEDULED: "bg-blue-100 text-blue-800",
  FIRST_INTERVIEW_FEEDBACK_PENDING: "bg-orange-100 text-orange-800",
  FIRST_INTERVIEW_REJECT: "bg-red-100 text-red-800",
  SECOND_INTERVIEW_SCHEDULED: "bg-blue-100 text-blue-800",
  SECOND_INTERVIEW_FEEDBACK_PENDING: "bg-orange-100 text-orange-800",
  SECOND_INTERVIEW_REJECT: "bg-red-100 text-red-800",
  THIRD_INTERVIEW_SCHEDULED: "bg-blue-100 text-blue-800",
  THIRD_INTERVIEW_FEEDBACK_PENDING: "bg-orange-100 text-orange-800",
  THIRD_INTERVIEW_REJECT: "bg-red-100 text-red-800",
  INTERNEL_REJECT: "bg-red-100 text-red-800",
  CLIENT_REJECT: "bg-red-100 text-red-800",
  FINAL_SELECT: "bg-green-100 text-green-800",
    JOINED: "bg-green-100 text-green-800",
    BACKEDOUT: "bg-gray-100 text-gray-800",
    NOT_RELEVANT: "bg-gray-100 text-gray-800",
  };

const statusLabelMap = {
  SUBMITTED_TO_CLIENT: "Submitted to Client",
  NO_RESPONSE: "No Response",
  IMMEDIATE: "Immediate",
  REJECTED_BY_CLIENT: "Rejected by Client",
};

const getStatusLabel = (status) =>
  statusLabelMap[status] ||
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDateTime = (dateTime) => {
  if (!dateTime) return "Not available";
  try {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid date";
  }
};

const formatDate = (date) => {
  if (!date) return "Not available";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid date";
  }
};

const InfoItem = ({ label, value }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">{label}</h3>
    <p className="text-sm text-gray-900 font-medium">{value || "Not specified"}</p>
  </div>
);

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Get current user from localStorage
  const currentUserName = localStorage.getItem("username") || "";
  const currentUserRole = (localStorage.getItem("role") || "").replace("ROLE_", "").toUpperCase();
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SECONDARY_ADMIN";

  useEffect(() => {
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const data = await applicationAPI.getById(id);
        setApplication(data);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load application details");
        console.error("Error fetching application:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCandidatesAndJobs = async () => {
      try {
        const [candidatesData, jobsData] = await Promise.all([
          candidateAPI.getAll(),
          jobAPI.getAll()
        ]);
        setCandidates(candidatesData || []);
        setJobs(jobsData || []);
      } catch (err) {
        console.error("Error fetching candidates/jobs:", err);
      }
    };

    if (id) {
      fetchApplication();
      if (isAdmin) {
        fetchCandidatesAndJobs();
      }
    }
  }, [id, isAdmin]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/applications");
    }
  };

  const handleViewResume = async () => {
    if (!application?.id) return;
    try {
      setResumeLoading(true);
      const resumeUrl = await applicationAPI.viewResume(application.id);
      window.open(resumeUrl, "_blank");
    } catch (err) {
      alert(err.message || "Failed to open resume");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleViewCandidate = () => {
    if (application?.candidate?.id) {
      navigate(`/candidates/${application.candidate.id}`);
    }
  };

  const handleViewJob = () => {
    if (application?.job?.id) {
      navigate(`/jobs/${application.job.id}`);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === application?.status) {
      return;
    }

    if (!statusDescription || statusDescription.trim() === "") {
      return;
    }

    try {
      setUpdatingStatus(true);
      await applicationAPI.update(application.id, {
        status: newStatus,
        statusDescription: statusDescription.trim(),
      });
      
      // Refresh application data
      const updatedData = await applicationAPI.getById(id);
      setApplication(updatedData);
      
      // Reset form
      setNewStatus("");
      setStatusDescription("");
      setShowStatusChange(false);
    } catch (err) {
      alert(err.message || "Failed to update status");
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusClass = (status) => {
    return statusClassMap[status] || "bg-gray-100 text-gray-800";
  };

  const handleScheduleInterview = async (interviewData) => {
    try {
      await interviewAPI.schedule(application.id, interviewData);
      alert("Interview scheduled successfully");
      setShowInterviewModal(false);
      // Refresh application data
      const updatedData = await applicationAPI.getById(id);
      setApplication(updatedData);
    } catch (err) {
      alert(err.message || "Failed to schedule interview");
      console.error("Error scheduling interview:", err);
    }
  };

  const handleEditApplication = async (formData) => {
    try {
      const updateData = {
        status: formData.status,
        statusDescription: formData.statusDescription,
        resumeFile: formData.resumeFile,
        useMasterResume: formData.useMasterResume
      };
      await applicationAPI.update(application.id, updateData);
      alert("Application updated successfully");
      setShowEditModal(false);
      // Refresh application data
      const updatedData = await applicationAPI.getById(id);
      setApplication(updatedData);
    } catch (err) {
      alert(err.message || "Failed to update application");
      console.error("Error updating application:", err);
    }
  };

  const handleDeleteApplication = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteApplication = async () => {
    if (!application?.id) return;

    try {
      setDeleting(true);
      await applicationAPI.delete(application.id);
      setShowDeleteModal(false);
      navigate("/applications");
    } catch (err) {
      alert(err.message || "Failed to delete application");
      console.error("Error deleting application:", err);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 mt-16">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
              <p className="text-gray-600">Loading application details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex min-h-screen bg-gray-50 mt-16">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The application you're looking for doesn't exist."}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const sortedStatusHistory = application.statusHistory
    ? [...application.statusHistory].sort((a, b) => {
        const dateA = new Date(a.changedAt);
        const dateB = new Date(b.changedAt);
        return dateB - dateA; // Most recent first
      })
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50 mt-16">
      <Navbar />
      <main className="flex-1 p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="fas fa-arrow-left text-gray-400"></i>
            Back to Applications
          </button>
          {application?.id && (
            <span className="text-xs font-medium text-gray-500">
              Application ID: <span className="text-gray-700">{application.id}</span>
            </span>
          )}
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application #{application.id}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    statusClassMap[application.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getStatusLabel(application.status)}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar text-gray-400"></i>
                  Applied: {formatDate(application.appliedAt)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 flex-wrap">
                {(application.resumeAvailable || application.candidate?.hasResume) && (
                  <button
                    onClick={handleViewResume}
                    disabled={resumeLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      resumeLoading
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <i className={`fas ${resumeLoading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                    {resumeLoading ? "Opening..." : "View Resume"}
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      <i className="fas fa-calendar-plus"></i>
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      <i className="fas fa-edit"></i>
                      Edit Application
                    </button>
                    <button
                      onClick={handleDeleteApplication}
                      disabled={deleting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        deleting
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      <i className={`fas ${deleting ? "fa-spinner fa-spin" : "fa-trash"}`}></i>
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
                {/* Check if current user is the assigner or admin */}
                {(() => {
                  const isAssignedByCurrentUser = application.createdByUsername && 
                    currentUserName && 
                    application.createdByUsername.trim().toLowerCase() === currentUserName.trim().toLowerCase();
                  const canModify = isAssignedByCurrentUser || isAdmin;
                  
                  if (!canModify) {
                    // User is not the assigner and not admin - show read-only status badge
                    return (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold ${getStatusClass(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        <span className="text-xs text-gray-500" title="Only the user who assigned this job can change the status">
                          <i className="fas fa-lock"></i>
                        </span>
                      </div>
                    );
                  }
                  
                  // User is the assigner - allow status change
                  return (
                    <>
                      <div className="relative inline-flex items-center">
                        <select
                          value={showStatusChange ? newStatus : application.status}
                          onChange={(e) => {
                            const selectedStatus = e.target.value;
                            if (!selectedStatus || selectedStatus === application.status) {
                              setNewStatus("");
                              setStatusDescription("");
                              setShowStatusChange(false);
                              return;
                            }
                            setNewStatus(selectedStatus);
                            setShowStatusChange(true);
                            if (!statusDescription) {
                              setStatusDescription("");
                            }
                          }}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusClass(showStatusChange ? newStatus : application.status)}`}
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.25rem center',
                            backgroundSize: '1em 1em',
                            paddingRight: '1.75rem'
                          }}
                        >
                          <option value="NEW_CANDIDATE">New Candidate</option>
                          <option value="PENDING">Pending</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="PLACED">Placed</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="NOT_INTERESTED">Not Interested</option>
                          <option value="HOLD">Hold</option>
                          <option value="HIGH_CTC">High CTC</option>
                          <option value="DROPPED_BY_CLIENT">Dropped by Client</option>
                          <option value="SUBMITTED_TO_CLIENT">Submitted to Client</option>
                          <option value="NO_RESPONSE">No Response</option>
                          <option value="IMMEDIATE">Immediate</option>
                          <option value="REJECTED_BY_CLIENT">Rejected by Client</option>
                          <option value="CLIENT_SHORTLIST">Client Shortlist</option>
                          <option value="FIRST_INTERVIEW_SCHEDULED">1st Interview Scheduled</option>
                          <option value="FIRST_INTERVIEW_FEEDBACK_PENDING">1st Interview Feedback Pending</option>
                          <option value="FIRST_INTERVIEW_REJECT">1st Interview Reject</option>
                          <option value="SECOND_INTERVIEW_SCHEDULED">2nd Interview Scheduled</option>
                          <option value="SECOND_INTERVIEW_FEEDBACK_PENDING">2nd Interview Feedback Pending</option>
                          <option value="SECOND_INTERVIEW_REJECT">2nd Interview Reject</option>
                          <option value="THIRD_INTERVIEW_SCHEDULED">3rd Interview Scheduled</option>
                          <option value="THIRD_INTERVIEW_FEEDBACK_PENDING">3rd Interview Feedback Pending</option>
                          <option value="THIRD_INTERVIEW_REJECT">3rd Interview Reject</option>
                          <option value="INTERNEL_REJECT">Internel Reject</option>
                          <option value="CLIENT_REJECT">Client Reject</option>
                          <option value="FINAL_SELECT">Final Select</option>
                          <option value="JOINED">Joined</option>
                          <option value="BACKEDOUT">Backed Out</option>
                          <option value="NOT_RELEVANT">Not Relevant</option>
                        </select>
                        {updatingStatus && (
                          <i className="fas fa-spinner fa-spin text-blue-500 text-xs ml-2"></i>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              {/* Small description box that appears when status is changed */}
              {showStatusChange && newStatus && newStatus !== application.status && (
                <div className="mt-2 space-y-2 max-w-md">
                  <textarea
                    value={statusDescription}
                    onChange={(e) => setStatusDescription(e.target.value)}
                    placeholder="Add a description for this status change... (required)"
                    rows="2"
                    className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStatusChange}
                      disabled={updatingStatus || !statusDescription.trim()}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? 'Saving...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => {
                        setNewStatus("");
                        setStatusDescription("");
                        setShowStatusChange(false);
                      }}
                      disabled={updatingStatus}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h2>
          {application.candidate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {application.candidate.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={handleViewCandidate}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      {application.candidate.name || "N/A"}
                    </button>
                    <p className="text-sm text-gray-500">ID: {application.candidate.id}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {application.candidate.email && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-envelope text-gray-400"></i>
                      <span>{application.candidate.email}</span>
                    </div>
                  )}
                  {application.candidate.phone && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-phone text-gray-400"></i>
                      <span>{application.candidate.phone}</span>
                    </div>
                  )}
                  {application.candidate.location && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-gray-400"></i>
                      <span>{application.candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Experience"
                  value={application.candidate.experience ? `${application.candidate.experience} years` : "Not specified"}
                />
                <InfoItem
                  label="Notice Period"
                  value={application.candidate.noticePeriod ? `${application.candidate.noticePeriod} days` : "Not specified"}
                />
                <InfoItem
                  label="Current CTC"
                  value={application.candidate.currentCtc ? `${application.candidate.currentCtc} LPA` : "Not specified"}
                />
                <InfoItem
                  label="Expected CTC"
                  value={application.candidate.expectedCtc ? `${application.candidate.expectedCtc} LPA` : "Not specified"}
                />
                <InfoItem
                  label="Candidate Added By"
                  value={
                    application.candidate?.createdByUsername 
                      ? (application.candidate?.createdByEmail 
                          ? `${application.candidate.createdByUsername} (${application.candidate.createdByEmail})`
                          : application.candidate.createdByUsername)
                      : "N/A"
                  }
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Candidate information not available</p>
          )}
        </div>

        {/* Job Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
          {application.job ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Job Details</h3>
                <button
                  onClick={handleViewJob}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 underline mb-1 text-left"
                >
                  {application.job.jobName || "N/A"}
                </button>
                <p className="text-sm text-gray-600 mb-4">Job ID: {application.job.id}</p>
                {application.job.jobLocation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <i className="fas fa-map-marker-alt text-gray-400"></i>
                    <span>{application.job.jobLocation}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Client Information</h3>
                {application.job.client ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {application.job.client.clientName || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Client ID: {application.job.client.id}</p>
                  </>
                ) : (
                  <p className="text-gray-600">Client information not available</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Job information not available</p>
          )}
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Application ID" value={application.id} />
            <InfoItem label="Applied On" value={formatDate(application.appliedAt)} />
            <InfoItem
              label="Assigned By"
              value={application.createdByUsername || "N/A"}
            />
            {application.createdByEmail && (
              <InfoItem label="Assigned By Email" value={application.createdByEmail} />
            )}
            <InfoItem
              label="Resume Available"
              value={(application.resumeAvailable || application.candidate?.hasResume) ? "Yes" : "No"}
            />
            {application.hasInterviews && (
              <InfoItem label="Has Interviews" value="Yes" />
            )}
          </div>
        </div>

        {/* Interview Details */}
        {application.interviews && application.interviews.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h2>
            <div className="space-y-4">
              {application.interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border-l-4 border-green-500 pl-4 py-3 bg-gray-50 rounded-r-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Interview Date:</span>
                      <span className="ml-2 text-gray-900">
                        {interview.interviewDate ? formatDate(interview.interviewDate) : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Time:</span>
                      <span className="ml-2 text-gray-900">
                        {interview.interviewTime ? 
                          `${interview.interviewTime}${interview.endTime ? ` - ${interview.endTime}` : ''}` : 
                          'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Job:</span>
                      <span className="ml-2 text-gray-900">{interview.jobTitle || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Client:</span>
                      <span className="ml-2 text-gray-900">{interview.clientName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
          {sortedStatusHistory.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-600">
              No status history available for this application.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedStatusHistory.map((history, index) => (
                <div
                  key={history.id || index}
                  className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusClassMap[history.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatusLabel(history.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(history.changedAt)}
                      </span>
                    </div>
                  </div>
                  {history.description && (
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{history.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Changed by: {history.changedByName || "N/A"}
                    {history.changedByEmail && ` (${history.changedByEmail})`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showInterviewModal && application && (
        <InterviewModal
          application={application}
          onSubmit={handleScheduleInterview}
          onClose={() => setShowInterviewModal(false)}
        />
      )}

      {showEditModal && application && (
        <ApplicationModal
          application={application}
          candidates={candidates}
          jobs={jobs}
          onSave={handleEditApplication}
          onClose={() => setShowEditModal(false)}
          showToast={(title, message, type) => {
            if (type === "success") {
              alert(message);
            } else {
              alert(message);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Application"
          message="Are you sure you want to delete this application? This action cannot be undone."
          onConfirm={confirmDeleteApplication}
          onClose={() => {
            setShowDeleteModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ApplicationDetailsPage;

