import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { interviewAPI } from "../../api/api";

const statusClassMap = {
  SCHEDULED: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const applicationStatusClassMap = {
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

const getStatusLabel = (status) => {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

const formatTime = (time) => {
  if (!time) return "Not available";
  return time;
};

const InfoItem = ({ label, value }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">{label}</h3>
    <p className="text-sm text-gray-900 font-medium">{value || "Not specified"}</p>
  </div>
);

const InterviewDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await interviewAPI.getDetails(id);
        console.log("Interview details received:", data);
        setInterview(data);
      } catch (err) {
        console.error("Failed to load interview", err);
        setError(err.message || "Failed to load interview details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInterview();
    }
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/interviews");
    }
  };

  const handleViewCandidate = () => {
    if (interview?.candidateId) {
      navigate(`/candidates/${interview.candidateId}`);
    }
  };

  const handleViewJob = () => {
    if (interview?.jobId) {
      navigate(`/jobs/${interview.jobId}`);
    }
  };

  const handleViewApplication = () => {
    if (interview?.applicationId) {
      navigate(`/applications/${interview.applicationId}`);
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
              <p className="text-gray-600">Loading interview details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The interview you're looking for doesn't exist."}</p>
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

  const interviewStatus = interview.status || "SCHEDULED";
  const applicationStatus = interview.applicationStatus || "";

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
          <span>Back to Interviews</span>
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Interview Details
              </h1>
              <p className="text-sm text-gray-500">ID: {interview.id}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  statusClassMap[interviewStatus] || "bg-gray-100 text-gray-800"
                }`}
              >
                {getStatusLabel(interviewStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Interview Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Interview Date" value={formatDate(interview.interviewDate)} />
                <InfoItem label="Start Time" value={formatTime(interview.interviewTime)} />
                <InfoItem label="End Time" value={formatTime(interview.endTime)} />
                <InfoItem label="Scheduled On" value={formatDate(interview.scheduledOn)} />
                {interview.completedAt && (
                  <InfoItem label="Completed At" value={formatDateTime(interview.completedAt)} />
                )}
                <InfoItem
                  label="Duration"
                  value={
                    interview.interviewTime && interview.endTime
                      ? `${interview.interviewTime} - ${interview.endTime}`
                      : "Not specified"
                  }
                />
              </div>
              {interview.description && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Description</h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{interview.description}</p>
                </div>
              )}
            </div>

            {/* Candidate & Job Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Candidate</h3>
                  <button
                    onClick={handleViewCandidate}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    {interview.candidateName || "Not specified"}
                  </button>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Job Title</h3>
                  <button
                    onClick={handleViewJob}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    {interview.jobTitle || "Not specified"}
                  </button>
                </div>
                {interview.clientName && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Client</h3>
                    <p className="text-sm text-gray-900 font-medium">{interview.clientName}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Application</h3>
                  <button
                    onClick={handleViewApplication}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    View Application #{interview.applicationId}
                  </button>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status History</h2>
              {interview.statusHistory && interview.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {interview.statusHistory.map((history, index) => (
                    <div
                      key={history.id || index}
                      className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                applicationStatusClassMap[history.status] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {getStatusLabel(history.status)}
                            </span>
                          </div>
                          {history.description && (
                            <p className="text-sm text-gray-700 mt-1">{history.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {history.changedByName && (
                              <span>
                                <i className="fas fa-user mr-1"></i>
                                {history.changedByName}
                              </span>
                            )}
                            {history.changedAt && (
                              <span>
                                <i className="fas fa-clock mr-1"></i>
                                {formatDateTime(history.changedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-history text-3xl mb-2"></i>
                  <p>No status history available for this application.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Scheduling Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Information</h2>
              <div className="space-y-4">
                <InfoItem
                  label="Scheduled By"
                  value={interview.scheduledByName || "Not specified"}
                />
                {interview.scheduledByEmail && (
                  <InfoItem label="Email" value={interview.scheduledByEmail} />
                )}
                <InfoItem
                  label="Application Status"
                  value={
                    applicationStatus ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          applicationStatusClassMap[applicationStatus] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatusLabel(applicationStatus)}
                      </span>
                    ) : (
                      "Not specified"
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailsPage;

