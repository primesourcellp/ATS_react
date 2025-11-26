import React, { useEffect, useState } from "react";
import Navbar from "../../layout/navbar";
import { candidateEmailAPI } from "../../api/api";
import Toast from "../toast/Toast";

const CandidateEmailManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [emailPreview, setEmailPreview] = useState("");
  const [defaultEmailTemplate, setDefaultEmailTemplate] = useState("");
  const [customEmailMessage, setCustomEmailMessage] = useState("");
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [companyUrl, setCompanyUrl] = useState("https://www.primesourcellp.com");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (companyUrl) {
      loadEmailPreview();
    }
  }, [companyUrl]);

  useEffect(() => {
    updatePreview();
  }, [customEmailMessage, useCustomMessage, companyUrl]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidatesData, previewData] = await Promise.all([
        candidateEmailAPI.getAllCandidates(),
        candidateEmailAPI.getPreview(),
      ]);
      setCandidates(candidatesData.candidates || []);
      const preview = previewData.preview || "";
      setDefaultEmailTemplate(preview);
      setEmailPreview(preview);
      if (previewData.companyUrl) {
        setCompanyUrl(previewData.companyUrl);
      }
    } catch (err) {
      showToast("Error", err.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadEmailPreview = async () => {
    try {
      const data = await candidateEmailAPI.getPreview();
      // Replace URL in preview with custom URL
      const defaultUrl = data.companyUrl || "https://www.primesourcellp.com";
      const urlToUse = companyUrl || defaultUrl;
      const updatedPreview = data.preview.replace(defaultUrl, urlToUse);
      setDefaultEmailTemplate(updatedPreview);
      if (!useCustomMessage) {
        setEmailPreview(updatedPreview);
      }
    } catch (err) {
      console.error("Failed to load email preview:", err);
    }
  };

  const updatePreview = () => {
    if (useCustomMessage && customEmailMessage) {
      // Replace {{URL}} placeholder with actual URL
      const preview = customEmailMessage.replace(/{{URL}}/g, companyUrl || "https://www.primesourcellp.com");
      setEmailPreview(preview);
    } else {
      // Use default template with custom URL
      const defaultUrl = "https://www.primesourcellp.com";
      const urlToUse = companyUrl || defaultUrl;
      const preview = defaultEmailTemplate.replace(defaultUrl, urlToUse);
      setEmailPreview(preview);
    }
  };

  const showToast = (title, message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const handleSelectCandidate = (candidateId) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSendSelected = async () => {
    if (selectedCandidates.size === 0) {
      showToast("No Selection", "Please select at least one candidate", "warning");
      return;
    }

    if (!window.confirm(`Send email to ${selectedCandidates.size} selected candidate(s)?`)) {
      return;
    }

    try {
      setSending(true);
      const messageToSend = useCustomMessage && customEmailMessage ? customEmailMessage : null;
      const result = await candidateEmailAPI.sendBulkEmails(
        Array.from(selectedCandidates),
        companyUrl,
        messageToSend
      );
      showToast(
        "Success",
        `Emails sent: ${result.successCount} successful, ${result.failCount} failed`,
        result.failCount === 0 ? "success" : "warning"
      );
      setSelectedCandidates(new Set());
    } catch (err) {
      showToast("Error", err.message || "Failed to send emails", "error");
    } finally {
      setSending(false);
    }
  };

  const handleSendAll = async () => {
    if (candidates.length === 0) {
      showToast("No Candidates", "No candidates available to send emails", "warning");
      return;
    }

    if (!window.confirm(`Send email to all ${candidates.length} candidates?`)) {
      return;
    }

    try {
      setSending(true);
      const messageToSend = useCustomMessage && customEmailMessage ? customEmailMessage : null;
      const result = await candidateEmailAPI.sendToAll(companyUrl, messageToSend);
      showToast(
        "Success",
        `Emails sent: ${result.successCount} successful, ${result.failCount} failed`,
        result.failCount === 0 ? "success" : "warning"
      );
    } catch (err) {
      showToast("Error", err.message || "Failed to send emails", "error");
    } finally {
      setSending(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex">
      <Navbar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidate Email Management</h1>
              <p className="text-gray-600 mt-1">Send invitation emails to candidates to visit your company website and explore job opportunities.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Candidate List */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Candidates ({filteredCandidates.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {selectedCandidates.size === filteredCandidates.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleSendSelected}
                    disabled={sending || selectedCandidates.size === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                      sending || selectedCandidates.size === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {sending ? "Sending..." : `Send to Selected (${selectedCandidates.size})`}
                  </button>
                  <button
                    onClick={handleSendAll}
                    disabled={sending}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                      sending
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {sending ? "Sending..." : "Send to All"}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
                {filteredCandidates.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No candidates found</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold">Name</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => (
                        <tr
                          key={candidate.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            selectedCandidates.has(candidate.id) ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(candidate.id)}
                              onChange={() => handleSelectCandidate(candidate.id)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-800">{candidate.name || "N/A"}</td>
                          <td className="px-3 py-2 text-gray-600">{candidate.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Column - Email Preview */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Preview</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company URL
                </label>
                <input
                  type="text"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://www.primesourcellp.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This URL will be included in the email for candidates to visit. Use {"{{URL}}"} in custom message to insert URL.
                </p>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={useCustomMessage}
                    onChange={(e) => {
                      setUseCustomMessage(e.target.checked);
                      if (!e.target.checked) {
                        setCustomEmailMessage("");
                      }
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Use Custom Email Message</span>
                </label>
                {useCustomMessage && (
                  <textarea
                    value={customEmailMessage}
                    onChange={(e) => setCustomEmailMessage(e.target.value)}
                    placeholder="Enter your custom email message here. Use {{URL}} to insert the company URL."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                  />
                )}
                {!useCustomMessage && (
                  <button
                    onClick={() => {
                      setUseCustomMessage(true);
                      setCustomEmailMessage(defaultEmailTemplate);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Click here to customize the email message
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-[40vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {emailPreview || "Loading preview..."}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default CandidateEmailManagement;

