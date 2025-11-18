import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { candidateAPI, applicationAPI } from "../../api/api";

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

const formatYearsValue = (value) => {
  if (!value) return null;
  const normalized = value.toString().trim();
  if (!normalized) return null;
  if (/\b(?:years?|yrs?)\b/i.test(normalized)) {
    return normalized.replace(/\s+/g, " ");
  }
  return `${normalized} years`;
};

const formatNoticeValue = (value) => {
  if (!value) return null;
  const normalized = value.toString().trim();
  if (!normalized) return null;
  if (/\b(?:day|days|month|months|week|weeks)\b/i.test(normalized)) {
    return normalized.replace(/\s+/g, " ");
  }
  return `${normalized} days`;
};

const formatCtcValue = (value) => {
  if (!value) return null;
  const normalized = value.toString().trim();
  if (!normalized) return null;
  if (/\b(?:lpa|lac|lakh|lakhs)\b/i.test(normalized)) {
    return normalized.replace(/\s+/g, " ");
  }
  return `${normalized} LPA`;
};

const CandidateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [applicationJobSearch, setApplicationJobSearch] = useState("");
  const [applicationIdSearch, setApplicationIdSearch] = useState("");
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const experienceDisplay = formatYearsValue(candidate?.experience) || "Not specified";
  const noticeDisplay = formatNoticeValue(candidate?.noticePeriod) || "Not specified";
  const currentCtcDisplay = formatCtcValue(candidate?.currentCtc) || "Not specified";
  const expectedCtcDisplay = formatCtcValue(candidate?.expectedCtc) || "Not specified";

  useEffect(() => {
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await candidateAPI.getById(id);
        console.log("Candidate data received:", data);
        console.log("Applications:", data?.applications);
        if (data?.applications) {
          console.log("Applications with status history:", data.applications.map(app => ({
            id: app.id,
            hasStatusHistory: !!app.statusHistory,
            statusHistoryLength: app.statusHistory?.length || 0
          })));
        }
        setCandidate(data);
      } catch (err) {
        console.error("Failed to load candidate", err);
        setError(err.message || "Failed to load candidate details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const filteredApplications = useMemo(() => {
    if (!candidate?.applications) {
      console.log("No applications found in candidate data");
      return [];
    }

    console.log("Filtering applications, total:", candidate.applications.length);
    const filtered = candidate.applications.filter((application) => {
      const jobName = (application.job?.jobName || application.job?.title || "").toLowerCase();
      const appId = application.id ? String(application.id) : "";

      const matchesJob =
        !applicationJobSearch ||
        jobName.includes(applicationJobSearch.trim().toLowerCase());

      const matchesApplicationId =
        !applicationIdSearch ||
        appId.toLowerCase().includes(applicationIdSearch.trim().toLowerCase());

      return matchesJob && matchesApplicationId;
    });
    console.log("Filtered applications count:", filtered.length);
    return filtered;
  }, [candidate?.applications, applicationJobSearch, applicationIdSearch]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/candidates");
    }
  };

  const handleViewResume = async () => {
    if (!candidate?.id) return;
    try {
      setResumeLoading(true);
      const resumeUrl = await candidateAPI.viewResume(candidate.id);
      window.open(resumeUrl, "_blank");
    } catch (err) {
      alert(err.message || "Failed to open resume");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleViewApplicationResume = async (applicationId) => {
    try {
      const url = await applicationAPI.viewResume(applicationId);
      window.open(url, "_blank");
    } catch (err) {
      alert(err.message || "Failed to open resume");
    }
  };

  const renderHeader = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{candidate?.name || "Candidate"}</h1>
            {candidate?.status && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusClassMap[candidate.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {getStatusLabel(candidate.status)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
            {candidate?.email && (
              <span className="flex items-center gap-2">
                <i className="fas fa-envelope text-gray-400"></i>
                {candidate.email}
              </span>
            )}
            {candidate?.phone && (
              <span className="flex items-center gap-2">
                <i className="fas fa-phone text-gray-400"></i>
                {candidate.phone}
              </span>
            )}
            {candidate?.location && (
              <span className="flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-gray-400"></i>
                {candidate.location}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleViewResume}
            disabled={!candidate?.hasResume || resumeLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              candidate?.hasResume
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <i className={`fas ${resumeLoading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
            {resumeLoading ? "Opening..." : "View Resume"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Experience" value={experienceDisplay} />
          <InfoItem label="Notice Period" value={noticeDisplay} />
          <InfoItem label="Current CTC" value={currentCtcDisplay} />
          <InfoItem label="Expected CTC" value={expectedCtcDisplay} />
          <InfoItem
            label="Added On"
            value={candidate?.createdAt ? formatDateTime(candidate.createdAt) : "Not available"}
          />
          <InfoItem
            label="Updated At"
            value={candidate?.updatedAt ? formatDateTime(candidate.updatedAt) : "Not available"}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Skills</h3>
            <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
              {candidate?.skills || "No skills listed"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Added By</h3>
            <p className="mt-1 text-sm text-gray-900 font-medium">
              {candidate?.createdByUsername || "N/A"}
            </p>
            {candidate?.createdByEmail && (
              <p className="text-xs text-gray-500">{candidate.createdByEmail}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAboutSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidate?.about || "No summary provided."}</p>
    </div>
  );

  const renderApplications = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <span className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-700">{filteredApplications.length}</span>
          </span>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <i className="fas fa-briefcase absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={applicationJobSearch}
                onChange={(e) => setApplicationJobSearch(e.target.value)}
                placeholder="Search job name..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="relative">
              <i className="fas fa-hashtag absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={applicationIdSearch}
                onChange={(e) => setApplicationIdSearch(e.target.value)}
                placeholder="Search application ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-600">
          No applications found for this candidate yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Application ID</Th>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Assigned By</Th>
                <Th>Applied On</Th>
                <Th>Resume</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredApplications.map((application) => (
                <React.Fragment key={application.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedApplicationId(expandedApplicationId === application.id ? null : application.id)}
                  >
                    <Td>{application.id}</Td>
                    <Td>
                      <div className="text-sm font-semibold text-gray-900">{application.job?.jobName || "N/A"}</div>
                      <div className="text-xs text-gray-500">
                        {application.job?.client?.clientName || "Client not specified"}
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusClassMap[application.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {application.status ? getStatusLabel(application.status) : "N/A"}
                      </span>
                    </Td>
                    <Td>
                      <div className="text-sm text-gray-900">{application.createdByUsername || "N/A"}</div>
                      {application.createdByEmail && (
                        <div className="text-xs text-gray-500">{application.createdByEmail}</div>
                      )}
                    </Td>
                    <Td>{application.appliedAt ? formatDate(application.appliedAt) : "N/A"}</Td>
                    <Td>
                      {application.resumeAvailable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewApplicationResume(application.id);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">Not Uploaded</span>
                      )}
                    </Td>
                  </tr>
                  {expandedApplicationId === application.id && (
                    <tr className="bg-blue-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Status History</h4>
                          {application.statusHistory && Array.isArray(application.statusHistory) && application.statusHistory.length > 0 ? (
                            <div className="space-y-2">
                              {application.statusHistory
                                .filter(history => history != null)
                                .sort((a, b) => {
                                  const dateA = a.changedAt ? new Date(a.changedAt).getTime() : 0;
                                  const dateB = b.changedAt ? new Date(b.changedAt).getTime() : 0;
                                  return dateB - dateA;
                                })
                                .map((history, idx) => (
                                  <div key={history.id || idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                              statusClassMap[history.status] || "bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {history.status ? getStatusLabel(history.status) : "N/A"}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {history.changedAt ? formatDateTime(history.changedAt) : "N/A"}
                                          </span>
                                        </div>
                                        {history.description && (
                                          <p className="text-sm text-gray-700 mt-1">{history.description}</p>
                                        )}
                                        <div className="text-xs text-gray-500 mt-1">
                                          Changed by: {history.changedByName || history.changedByEmail || "N/A"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                              No status history available for this application.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 mt-16">
      <Navbar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="fas fa-arrow-left text-gray-400"></i>
            Back to Candidates
          </button>
          {candidate?.id && (
            <span className="text-xs font-medium text-gray-500">
              Candidate ID: <span className="text-gray-700">{candidate.id}</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm flex justify-center">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              Loading candidate details...
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm text-red-700">
            {error}
          </div>
        ) : candidate ? (
          <>
            {renderHeader()}
            {renderAboutSection()}
            {renderApplications()}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center">
            <p className="text-gray-600">Candidate not found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
    <p className="mt-1 text-sm text-gray-900">{value}</p>
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{children}</th>
);

const Td = ({ children }) => <td className="px-4 py-3 text-sm text-gray-700 align-top">{children}</td>;

const formatDate = (value) => {
  if (!value) return "N/A";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

export default CandidateDetailsPage;

