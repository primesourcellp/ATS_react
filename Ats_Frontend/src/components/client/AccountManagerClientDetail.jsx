import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { clientAPI, userAPI } from "../../api/api";
import Toast from "../toast/Toast";

const AccountManagerClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [formRecruiterId, setFormRecruiterId] = useState("");
  const [formPerm, setFormPerm] = useState({
    canViewClient: true,
    canSeeInClientList: true,
    canViewJobs: true,
    canViewCandidates: true,
    canViewInterviews: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [clientData, recruiterData] = await Promise.all([
          clientAPI.getById(id),
          userAPI.getRecruiters(),
        ]);
        setClient(clientData);
        setRecruiters(recruiterData || []);
      } catch (err) {
        showToast(
          "Error",
          err.message || "Failed to load client permissions",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const showToast = (title, message, type = "success") => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  };

  const getPermissionFor = (recruiterId) => {
    if (!client || !client.permissions) return null;
    return (
      client.permissions.find(
        (p) => p.recruiter && p.recruiter.id === recruiterId
      ) || null
    );
  };

  const isRecruiterAssigned = (recruiterId) => {
    const perm = getPermissionFor(recruiterId);
    return (
      !!perm &&
      (perm.canViewClient || perm.canViewJobs || perm.canViewCandidates || perm.canViewInterviews)
    );
  };

  const filterRecruiters = () => {
    const term = recruiterSearch.trim().toLowerCase();
    return recruiters.filter((r) => {
      // Filter by assigned status if checkbox is checked
      if (showOnlyAssigned && !isRecruiterAssigned(r.id)) return false;
      // Filter by search term
      if (!term) return true;
      return r.username && r.username.toLowerCase().includes(term);
    });
  };

  const savePermissions = async (clientId, permsMap) => {
    const payload = Array.from(permsMap.values());
    const updated = await clientAPI.updateRecruiters(clientId, payload);
    setClient(updated);
  };

  const handleChipClick = (recruiterId) => {
    const perm = getPermissionFor(recruiterId);
    setFormRecruiterId(recruiterId);
    setFormPerm({
      canViewClient: !!perm?.canViewClient,
      canSeeInClientList: perm?.canSeeInClientList !== undefined ? !!perm?.canSeeInClientList : true,
      canViewJobs: !!perm?.canViewJobs,
      canViewCandidates: !!perm?.canViewCandidates,
      canViewInterviews: !!perm?.canViewInterviews,
    });
    setAssignModalOpen(true);
  };

  const handleSaveFromModal = async () => {
    if (!client || !formRecruiterId) {
      showToast(
        "Select recruiter",
        "Please choose a recruiter before saving.",
        "warning"
      );
      return;
    }
    try {
      setSaving(true);
      const existingPerms = client.permissions || [];
      const permMap = new Map();
      existingPerms.forEach((p) => {
        if (p.recruiter && p.recruiter.id != null) {
          permMap.set(p.recruiter.id, {
            recruiterId: p.recruiter.id,
            canViewClient: !!p.canViewClient,
            canSeeInClientList: p.canSeeInClientList !== undefined ? !!p.canSeeInClientList : true,
            canViewJobs: !!p.canViewJobs,
            canViewCandidates: !!p.canViewCandidates,
            canViewInterviews: !!p.canViewInterviews,
          });
        }
      });
      permMap.set(formRecruiterId, {
        recruiterId: formRecruiterId,
        ...formPerm,
      });
      await savePermissions(client.id, permMap);
      showToast("Saved", "Recruiter permissions updated.", "success");
      setAssignModalOpen(false);
      setFormRecruiterId("");
    } catch (err) {
      showToast(
        "Error",
        err.message || "Failed to update recruiter permissions.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAllForRecruiter = () => {
    if (!formRecruiterId) {
      showToast(
        "Select recruiter",
        "Please choose a recruiter before clearing permissions.",
        "warning"
      );
      return;
    }
    // Just uncheck all boxes; user must click Save to persist
    setFormPerm({
      canViewClient: false,
      canSeeInClientList: false,
      canViewJobs: false,
      canViewCandidates: false,
      canViewInterviews: false,
    });
  };

  return (
    <div className="flex">
      <Navbar />
      <main className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-md p-15 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Account Manager – Client Detail
            </h2>
            {client && (
              <p className="text-sm text-gray-500 mt-1">
                Manage recruiter permissions for{" "}
                <span className="font-semibold">{client.clientName}</span>.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate("/account-manager")}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to list
          </button>
        </div>

        {loading || !client ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-base">Loading client details...</p>
          </div>
        ) : (
          <section className="bg-white rounded-lg shadow-md p-4 overflow-auto">
            <div className="border border-green-300 rounded-xl p-6 shadow-sm bg-green-50/40">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {client.clientName}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {client.id} • {client.client_number || "No contact"}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700">
                    Recruiter permissions for this client:
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyAssigned}
                        onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                        className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span>Show only assigned</span>
                    </label>
                    <input
                      type="text"
                      value={recruiterSearch}
                      onChange={(e) => setRecruiterSearch(e.target.value)}
                      placeholder="Search recruiter"
                      className="hidden md:block px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormRecruiterId("");
                        setFormPerm({
                          canViewClient: false,
                          canSeeInClientList: true,
                          canViewJobs: false,
                          canViewCandidates: false,
                          canViewInterviews: false,
                        });
                        setAssignModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                    >
                      + Assign recruiter
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg bg-white px-3 py-3">
                  {filterRecruiters().length === 0 ? (
                    <p className="text-sm text-gray-400 py-1">
                      {showOnlyAssigned
                        ? "No recruiters assigned match this search for this client."
                        : "No recruiters match this search."}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filterRecruiters().map((r, idx) => {
                        const perm = getPermissionFor(r.id);
                        const canClient = !!perm?.canViewClient;
                        const canJobs = !!perm?.canViewJobs;
                        const canApps = !!perm?.canViewCandidates;
                        const canInterviews = !!perm?.canViewInterviews;
                        const active =
                          canClient || canJobs || canApps || canInterviews;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleChipClick(r.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                              active
                                ? "border-green-300 bg-green-50 hover:bg-green-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-gray-800 font-medium">{r.username}</span>
                            <span className="flex flex-wrap gap-1 justify-end">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                                  canClient
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                              >
                                Edit/delete
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                                  canJobs
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                              >
                                Jobs
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                                  canApps
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                              >
                                Applications
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                                  canInterviews
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                              >
                                Interviews
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              If a client has no recruiters selected, then any recruiter can
              edit/delete that client. If one or more recruiters are selected,
              only those recruiters (and admins) can edit/delete it.
            </p>
          </section>
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            />
          ))}
        </div>

        {/* Assign recruiter modal */}
        {assignModalOpen && client && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 pointer-events-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Assign recruiter
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Client: <span className="font-semibold">{client.clientName}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Recruiter
                  </p>
                  <select
                    value={formRecruiterId || ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : "";
                      setFormRecruiterId(val);

                      if (!val || !client) {
                        setFormPerm({
                          canViewClient: false,
                          canSeeInClientList: true,
                          canViewJobs: false,
                          canViewCandidates: false,
                          canViewInterviews: false,
                        });
                        return;
                      }

                      const existing = getPermissionFor(val);
                      if (
                        existing &&
                        (existing.canViewClient ||
                          existing.canViewJobs ||
                          existing.canViewCandidates ||
                          existing.canViewInterviews ||
                          existing.canSeeInClientList)
                      ) {
                        showToast(
                          "Already assigned",
                          "This recruiter already has permissions for this client. You can update them below.",
                          "warning"
                        );
                        setFormPerm({
                          canViewClient: !!existing.canViewClient,
                          canSeeInClientList: existing.canSeeInClientList !== undefined ? !!existing.canSeeInClientList : true,
                          canViewJobs: !!existing.canViewJobs,
                          canViewCandidates: !!existing.canViewCandidates,
                          canViewInterviews: !!existing.canViewInterviews,
                        });
                      } else {
                        setFormPerm({
                          canViewClient: false,
                          canSeeInClientList: true,
                          canViewJobs: false,
                          canViewCandidates: false,
                          canViewInterviews: false,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="">Select recruiter</option>
                    {recruiters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-3 text-xs text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formPerm.canViewClient}
                      onChange={(e) =>
                        setFormPerm((p) => ({
                          ...p,
                          canViewClient: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span>Allow this recruiter to edit/delete this client</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formPerm.canSeeInClientList}
                      onChange={(e) =>
                        setFormPerm((p) => ({
                          ...p,
                          canSeeInClientList: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span>Show only this assigned client in the client list</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formPerm.canViewJobs}
                      onChange={(e) =>
                        setFormPerm((p) => ({
                          ...p,
                          canViewJobs: e.target.checked,
                        }))
                      }
                    />
                    Show only this client's jobs in job list
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formPerm.canViewCandidates}
                      onChange={(e) =>
                        setFormPerm((p) => ({
                          ...p,
                          canViewCandidates: e.target.checked,
                        }))
                      }
                    />
                    Show only this client's applications/candidates
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formPerm.canViewInterviews}
                      onChange={(e) =>
                        setFormPerm((p) => ({
                          ...p,
                          canViewInterviews: e.target.checked,
                        }))
                      }
                    />
                    Show only this client's interviews
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssignModalOpen(false);
                    setFormRecruiterId("");
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAllForRecruiter}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={handleSaveFromModal}
                  disabled={saving}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccountManagerClientDetail;

