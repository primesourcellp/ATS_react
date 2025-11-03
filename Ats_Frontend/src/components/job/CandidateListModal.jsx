import { useEffect, useState } from "react";
import { candidateAPI } from "../../api/api";

const CandidateListModal = ({ job, onClose, onViewCandidate }) => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (job?.id) loadCandidates();
  }, [job?.id]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, statusFilter]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const candidatesData = await candidateAPI.getByJobId(job.id);

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      if (!candidatesData || candidatesData.length === 0) {
        onClose();
      }
    } catch (error) {
      console.error("Error loading candidates:", error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    if (!Array.isArray(candidates)) {
      setFilteredCandidates([]);
      return;
    }

    let result = [...candidates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.phone && c.phone.includes(term))
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    setFilteredCandidates(result);
  };

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <i className="fas fa-users text-blue-500"></i>
            Candidates for {job.jobName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-green-600 mb-2 md:mb-0"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600 min-w-[180px]"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="INTERVIEWED">INTERVIEWED</option>
            <option value="PLACED">PLACED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUBMITTED_BY_CLIENT">Submitted by Client</option>
            <option value="CLIENT_SHORTLIST">Client Shortlist</option>
            <option value="FIRST_INTERVIEW_SCHEDULED">First Interview Scheduled</option>
            <option value="FIRST_INTERVIEW_FEEDBACK_PENDING">First Interview Feedback Pending</option>
            <option value="FIRST_INTERVIEW_REJECT">First Interview Reject</option>
            <option value="SECOND_INTERVIEW_SCHEDULED">Second Interview Scheduled</option>
            <option value="SECOND_INTERVIEW_FEEDBACK_PENDING">Second Interview Feedback Pending</option>
            <option value="SECOND_INTERVIEW_REJECT">Second Interview Reject</option>
            <option value="THIRD_INTERVIEW_SCHEDULED">Third Interview Scheduled</option>
            <option value="THIRD_INTERVIEW_FEEDBACK_PENDING">Third Interview Feedback Pending</option>
            <option value="THIRD_INTERVIEW_REJECT">Third Interview Reject</option>
            <option value="INTERNEL_REJECT">Internel Reject</option>
            <option value="CLIENT_REJECT">Client Reject</option>
            <option value="FINAL_SELECT">Final Select</option>
            <option value="JOINED">Joined</option>
            <option value="BACKEDOUT">Backed Out</option>
          </select>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 border-b">Name</th>
                <th className="text-left px-4 py-2 border-b">Email</th>
                <th className="text-left px-4 py-2 border-b">Phone</th>
                <th className="text-left px-4 py-2 border-b">Status</th>
                <th className="text-center px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    Loading candidates...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    No candidates found
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{candidate.name || ""}</td>
                    <td className="px-4 py-2">{candidate.email || ""}</td>
                    <td className="px-4 py-2">{candidate.phone || ""}</td>
                    <td className="px-4 py-2">{candidate.status || ""}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center gap-2 justify-center"
                        onClick={() => onViewCandidate(candidate, job.id)}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            type="button"
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

export default CandidateListModal;
