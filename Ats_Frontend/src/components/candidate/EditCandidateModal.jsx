import { useState } from "react";
import { candidateAPI } from "../../api/api";

const EditCandidateModal = ({ candidate, onClose, onCandidateUpdated, showToast }) => {
  const [formData, setFormData] = useState({
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
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        showToast('Error', 'Please select a PDF, DOC, or DOCX file', 'error');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showToast('Error', 'File size exceeds the maximum limit of 5MB. Please upload a smaller file.', 'error');
        e.target.value = ''; // Clear the input
        return;
      }

      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showToast("Validation Error", "Please fill all required fields", "error");
      return;
    }
    try {
      setLoading(true);
      await candidateAPI.update(candidate.id, formData, resumeFile);
      onCandidateUpdated();
    } catch (error) {
      showToast("Error", error.message || "Failed to update candidate", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose} // click outside closes modal
    >
      {/* Modal Card */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            <i className="fas fa-edit mr-2 text-blue-500"></i>
            Edit Candidate
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Candidate
            </label>
            <textarea
              id="about"
              value={formData.about}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Experience / Notice / Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="text"
                id="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notice Period (Days)
              </label>
              <input
                type="text"
                id="noticePeriod"
                value={formData.noticePeriod}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CTC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current CTC (LPA)
              </label>
              <input
                type="text"
                id="currentCtc"
                value={formData.currentCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected CTC (LPA)
              </label>
              <input
                type="text"
                id="expectedCtc"
                value={formData.expectedCtc}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <div className="relative">
              <i className="fas fa-tools absolute left-3 top-3 text-gray-400"></i>
              <textarea
                id="skills"
                value={formData.skills}
                onChange={handleInputChange}
                rows="4"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y min-h-[120px]"
                placeholder="List skills separated by commas (e.g., React, Node.js, Python)"
              ></textarea>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF, DOC, DOCX) - Optional (Max 5MB)
            </label>
            <input
              type="file"
              id="resume"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              {(candidate.hasResume || candidate.resumePath)
                ? "A resume is already uploaded. Select a new file to replace it."
                : "No resume uploaded yet."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <i className="fas fa-times mr-2"></i> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-save mr-2"></i>
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCandidateModal;
