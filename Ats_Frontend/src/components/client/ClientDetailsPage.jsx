import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { clientAPI } from "../../api/api";

const statusClassMap = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
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

const InfoItem = ({ label, value }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">{label}</h3>
    <p className="text-sm text-gray-900 font-medium">{value || "Not specified"}</p>
  </div>
);

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobIdSearch, setJobIdSearch] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await clientAPI.getById(id);
        console.log("Client data received:", data);
        setClient(data);
      } catch (err) {
        console.error("Failed to load client", err);
        setError(err.message || "Failed to load client details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  const filteredJobs = useMemo(() => {
    if (!client?.jobs) {
      return [];
    }

    const filtered = client.jobs.filter((job) => {
      const jobName = (job.jobName || job.job_name || "").toLowerCase();
      const jobId = job.id ? String(job.id) : "";

      const matchesJobName =
        !jobSearch ||
        jobName.includes(jobSearch.trim().toLowerCase());

      const matchesJobId =
        !jobIdSearch ||
        jobId.toLowerCase().includes(jobIdSearch.trim().toLowerCase());

      return matchesJobName && matchesJobId;
    });

    return filtered;
  }, [client?.jobs, jobSearch, jobIdSearch]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/clients");
    }
  };

  const handleViewJob = (jobId) => {
    if (jobId) {
      navigate(`/jobs/${jobId}`);
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
              <p className="text-gray-600">Loading client details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The client you're looking for doesn't exist."}</p>
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

  const clientName = client.clientName || client.client_name || "N/A";
  const clientNumber = client.clientNumber || client.client_number || "N/A";
  const address = client.address || "Not specified";

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
          <span>Back to Clients</span>
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-2xl">
                  {clientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{clientName}</h1>
                <p className="text-sm text-gray-500">Client ID: {client.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoItem label="Client Name" value={clientName} />
              <InfoItem label="Client ID" value={client.id} />
              <InfoItem label="Contact Number" value={clientNumber} />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Address</h3>
                <p className="text-sm text-gray-900 font-medium">{address}</p>
              </div>
              <InfoItem
                label="Total Jobs"
                value={client.jobs ? client.jobs.length : 0}
              />
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Associated Jobs</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <span className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-700">{filteredJobs.length}</span>
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <i className="fas fa-briefcase absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search by job name..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="relative">
                  <i className="fas fa-hashtag absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search by job ID..."
                    value={jobIdSearch}
                    onChange={(e) => setJobIdSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-600">
              {client.jobs && client.jobs.length > 0
                ? "No jobs match your search criteria."
                : "No jobs associated with this client."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <React.Fragment key={job.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewJob(job.id);
                              }}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline text-left"
                            >
                              {job.jobName || job.job_name || "N/A"}
                            </button>
                            <p className="text-sm text-gray-500 mt-1">ID: {job.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {job.jobLocation || job.job_location || "Not specified"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              statusClassMap[job.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {job.jobType || job.job_type || "Not specified"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewJob(job.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View Details
                          </button>
                          <i
                            className={`fas fa-chevron-${expandedJobId === job.id ? "up" : "down"} text-gray-400`}
                          ></i>
                        </td>
                      </tr>
                      {expandedJobId === job.id && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Job Details</h4>
                                <div className="space-y-2 text-sm">
                                  {job.jobExperience && (
                                    <p>
                                      <span className="font-medium text-gray-600">Experience:</span>{" "}
                                      {job.jobExperience || job.job_experience}
                                    </p>
                                  )}
                                  {job.jobSalaryRange && (
                                    <p>
                                      <span className="font-medium text-gray-600">Salary Range:</span>{" "}
                                      {job.jobSalaryRange || job.job_salary_range}
                                    </p>
                                  )}
                                  {job.skillsname && (
                                    <p>
                                      <span className="font-medium text-gray-600">Skills:</span> {job.skillsname}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {job.jobDiscription || job.job_discription || "No description provided."}
                                </p>
                              </div>
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
      </div>
    </div>
  );
};

export default ClientDetailsPage;

