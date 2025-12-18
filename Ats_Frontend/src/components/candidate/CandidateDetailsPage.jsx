import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { candidateAPI } from "../../api/api";
import Toast from "../toast/Toast";

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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
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
        // Initialize form data
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "SCHEDULED",
          about: data.about || "",
          experience: data.experience || "",
          noticePeriod: data.noticePeriod || "",
          skills: data.skills || "",
          currentCtc: data.currentCtc || "",
          expectedCtc: data.expectedCtc || "",
          location: data.location || "",
        });
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setResumeFile(null);
    // Reset form data to original candidate data
    if (candidate) {
      setFormData({
        name: candidate.name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        status: candidate.status || "SCHEDULED",
        about: candidate.about || "",
        experience: candidate.experience || "",
        noticePeriod: candidate.noticePeriod || "",
        skills: candidate.skills || "",
        currentCtc: candidate.currentCtc || "",
        expectedCtc: candidate.expectedCtc || "",
        location: candidate.location || "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        showToast('Error', 'Please select a PDF, DOC, or DOCX file', 'error');
        e.target.value = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast('Error', 'File size exceeds the maximum limit of 5MB', 'error');
        e.target.value = '';
        return;
      }

      setResumeFile(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showToast("Validation Error", "Please fill all required fields", "error");
      return;
    }
    try {
      setSaving(true);
      await candidateAPI.update(candidate.id, formData, resumeFile);
      // Reload candidate data
      const data = await candidateAPI.getById(id);
      setCandidate(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        status: data.status || "SCHEDULED",
        about: data.about || "",
        experience: data.experience || "",
        noticePeriod: data.noticePeriod || "",
        skills: data.skills || "",
        currentCtc: data.currentCtc || "",
        expectedCtc: data.expectedCtc || "",
        location: data.location || "",
      });
      setIsEditing(false);
      setResumeFile(null);
      showToast('Success', 'Candidate updated successfully', 'success');
    } catch (err) {
      showToast("Error", err.message || "Failed to update candidate", "error");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (title, message, type = 'success') => {
    const toastId = Date.now();
    const newToast = { id: toastId, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
  };


  const renderHeader = () => (
    <form onSubmit={handleSave}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  type="button"
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
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {isEditing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    id="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5 years"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notice Period</label>
                  <input
                    type="text"
                    id="noticePeriod"
                    value={formData.noticePeriod}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 30 days"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Current CTC</label>
                  <input
                    type="text"
                    id="currentCtc"
                    value={formData.currentCtc}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10 LPA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expected CTC</label>
                  <input
                    type="text"
                    id="expectedCtc"
                    value={formData.expectedCtc}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 15 LPA"
                  />
                </div>
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
                  <label className="block text-sm font-semibold text-gray-600 uppercase mb-2">Status *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 uppercase mb-2">Skills</label>
                  <textarea
                    id="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 whitespace-pre-wrap"
                    placeholder="List skills separated by commas"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 uppercase mb-2">Resume (PDF, DOC, DOCX) - Optional (Max 5MB)</label>
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(candidate.hasResume || candidate.resumePath)
                      ? "A resume is already uploaded. Select a new file to replace it."
                      : "No resume uploaded yet."}
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </form>
  );

  const renderAboutSection = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
      {isEditing ? (
        <textarea
          id="about"
          value={formData.about}
          onChange={handleInputChange}
          rows="4"
          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 whitespace-pre-wrap"
          placeholder="Enter candidate summary..."
        ></textarea>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidate?.about || "No summary provided."}</p>
      )}
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
                <Th>Status History</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredApplications.map((application) => (
                <React.Fragment key={application.id}>
                  <tr className="hover:bg-gray-50">
                    <Td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${application.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        {application.id}
                      </button>
                    </Td>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedApplicationId(expandedApplicationId === application.id ? null : application.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <i className={`fas fa-${expandedApplicationId === application.id ? 'chevron-up' : 'chevron-down'} text-xs`}></i>
                        {expandedApplicationId === application.id ? 'Hide' : 'View'} History
                      </button>
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

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
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

