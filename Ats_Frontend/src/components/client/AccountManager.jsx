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
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    const idStr = String(c.id || "").toLowerCase();
    return (
      (c.clientName && c.clientName.toLowerCase().includes(term)) ||
      idStr.includes(term)
    );
  });

  return (
    <div className="flex">
      <Navbar />
      <main className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-md p-16 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Account Manager</h2>
              <p className="text-xs text-gray-500 mt-1">
                Select a client to manage recruiter permissions and visibility rules.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600">
              <span>
                <span className="font-semibold text-gray-800">
                  {clients.length}
                </span>{" "}
                clients
              </span>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Clients – Assign Recruiters
                </h3>
                <span className="text-xs text-gray-500">
                  Click a client name to open the detailed permissions view.
                </span>
              </div>
              <div className="w-full md:w-72">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search by client name or ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                />
              </div>
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

