import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../layout/navbar";
import { clientAPI } from "../../api/api";
import Toast from "../toast/Toast";

const AccountManager = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientIdSearch, setClientIdSearch] = useState("");
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const clientData = await clientAPI.getAllForAdmin();
        setClients(clientData || []);
      } catch (err) {
        showToast(
          "Error",
          err.message || "Failed to load account manager data",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const showToast = (title, message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const filteredClients = clients.filter((c) => {
    // Filter by assigned recruiters first
    if (showOnlyAssigned) {
      // Check if client has permissions (assigned recruiters)
      // Handle both array and Set formats, and check if it has any items
      const hasAssignedRecruiters = c.permissions && 
        (Array.isArray(c.permissions) ? c.permissions.length > 0 : 
         (typeof c.permissions === 'object' && Object.keys(c.permissions).length > 0));
      if (!hasAssignedRecruiters) return false;
    }
    
    // Filter by ID search if provided
    if (clientIdSearch.trim()) {
      const idStr = String(c.id || "").toLowerCase();
      const searchId = clientIdSearch.trim().toLowerCase();
      if (!idStr.includes(searchId)) return false;
    }
    
    // Filter by general search term
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    return (
      (c.clientName && c.clientName.toLowerCase().includes(term)) ||
      (c.client_number && c.client_number.toLowerCase().includes(term))
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
              <h1 className="text-2xl font-bold text-gray-900">Account Manager</h1>
              <p className="text-gray-600 mt-1">Select a client to manage recruiter permissions and visibility rules.</p>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total Clients:</span>
              <span className="text-lg font-semibold text-gray-900">{filteredClients.length}</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyAssigned}
                onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Show only assigned clients</span>
            </label>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Client Count - Inline */}
            <div className="flex items-center gap-2 px-3 py-3.5 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium text-purple-700 whitespace-nowrap">Clients:</span>
              <span className="text-lg font-bold text-purple-900">{filteredClients.length}</span>
            </div>
            {/* General Search - Large and Prominent */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search clients by name, contact person, email, phone, or address..."
                  className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clientSearch && (
                  <button
                    onClick={() => setClientSearch('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-purple-50 rounded-r-lg transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search - Compact */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Client ID..."
                  className="w-full pl-10 pr-10 py-3.5 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={clientIdSearch}
                  onChange={(e) => setClientIdSearch(e.target.value)}
                />
                {clientIdSearch && (
                  <button
                    onClick={() => setClientIdSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading account data...</p>
          </div>
        ) : (
          <section className="bg-white rounded-lg shadow-md p-4 overflow-auto">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Clients – Assign Recruiters
              </h3>
              <span className="text-sm text-gray-500">
                Click a client name to open the detailed permissions view.
              </span>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              {filteredClients.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">
                  No clients match this search.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <li
                      key={client.id}
                      className="flex items-center justify-between py-2 px-1 hover:bg-green-50 rounded-lg cursor-pointer"
                      onClick={() =>
                        navigate(`/account-manager/clients/${client.id}`)
                      }
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          {client.clientName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          ID: {client.id} •{" "}
                          {client.client_number || "No contact"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded-lg border border-green-500 text-green-700 hover:bg-green-50"
                      >
                        Open details
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
      </main>
    </div>
  );
};

export default AccountManager;


