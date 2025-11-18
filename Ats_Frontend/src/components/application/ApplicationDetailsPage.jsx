import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { applicationAPI, candidateAPI } from "../../api/api";

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

    if (id) {
      fetchApplication();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
              <p className="text-gray-600">Loading application details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
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
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Applications</span>
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
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
            <div className="flex gap-3">
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
            </div>
          </div>
        </div>

        {/* Candidate Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
          {application.job ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Job Details</h3>
                <p className="text-lg font-semibold text-gray-900 mb-1">{application.job.jobName || "N/A"}</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
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
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;

