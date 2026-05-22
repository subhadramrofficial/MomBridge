// src/admin/MomRequests.jsx
import { useEffect, useState } from "react";
import {
  getMomRequestsApi,
  getSocialWorkersApi,
  assignWorkerApi,
} from "../../../service/api";
import "../components/Admin.css";

export default function MomRequests() {
  const [requests, setRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    fetchWorkers();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getMomRequestsApi();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const data = await getSocialWorkersApi();
      setWorkers(data || []);
    } catch (err) {
      console.error("Error fetching workers:", err);
      setWorkers([]);
    }
  };

  const handleWorkerChange = (requestId, workerId) => {
    setSelectedWorkers({
      ...selectedWorkers,
      [requestId]: workerId,
    });
  };

  const assignWorker = async (requestId) => {
    const workerId = selectedWorkers[requestId];
    if (!workerId) {
      alert("Please select a worker");
      return;
    }
    try {
      const res = await assignWorkerApi(requestId, workerId);
      alert(res.message || "Worker assigned successfully");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to assign worker");
    }
  };

  // Compute IDs of workers already assigned to pending/assigned requests
  const assignedWorkerIds = requests
    .filter((r) => r.status === "assigned" && r.worker_id)
    .map((r) => r.worker_id);

  return (
    <div className="admin-content">
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600 }}>
        Mom Charity Requests
      </h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No requests found.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
            padding: 16,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
              minWidth: 700,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", color: "#374151" }}>
                <th style={{ padding: "12px 16px" }}>No.</th>
                <th style={{ padding: "12px 16px" }}>Mother</th>
                <th style={{ padding: "12px 16px" }}>Contact</th>
                <th style={{ padding: "12px 16px" }}>Address</th>
                <th style={{ padding: "12px 16px" }}>Items</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Request Date</th>
                <th style={{ padding: "12px 16px" }}>Assigned Worker</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((req, index) => (
                <tr
                  key={req.request_id}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {req.mom_name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {req.mom_contact || "—"}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {req.mom_address || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {req.items?.map((i) => (
                      <div key={i.item}>
                        {i.item} × {i.quantity}
                      </div>
                    ))}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color:
                          req.status === "pending"
                            ? "#f59e0b"
                            : req.status === "assigned"
                              ? "#3b82f6"
                              : "#16a34a",
                      }}
                    >
                      {req.status === "completed"
                        ? "Completed ✅"
                        : req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {req.status === "pending" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <select
                          value={selectedWorkers[req.request_id] || ""}
                          onChange={(e) =>
                            handleWorkerChange(req.request_id, e.target.value)
                          }
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                            minWidth: 160,
                          }}
                        >
                          <option value="">Select Worker</option>
                          {workers
                            .filter(
                              (w) =>
                                !assignedWorkerIds.includes(w.worker_id) ||
                                w.worker_id === selectedWorkers[req.request_id],
                            )
                            .map((worker) => (
                              <option
                                key={worker.worker_id}
                                value={worker.worker_id}
                              >
                                {worker.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => assignWorker(req.request_id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            backgroundColor: "#3b82f6",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: "bold", color: "#3b82f6" }}>
                        {req.worker_name || "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
