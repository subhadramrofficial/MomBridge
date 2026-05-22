// src/admin/CharityVerification.jsx
import { useState, useEffect } from "react";
import {
  getAllCharityProvidersApi,
  approveCharityProviderApi,
  rejectCharityProviderApi,
} from "../../../service/api";
import "../components/Admin.css";

export default function CharityVerification() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const res = await getAllCharityProvidersApi();
      setCharities(res.data || []);
    } catch (err) {
      console.error("Error fetching charity providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await approveCharityProviderApi(id);
      if (res.status === 200) {
        setCharities(
          charities.map((c) =>
            c._id === id ? { ...c, status: "Approved" } : c
          )
        );
      } else alert("Failed to approve. Try again.");
    } catch (err) {
      console.error(err);
      alert("Error approving provider. Check console.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectCharityProviderApi(id);
      setCharities(
        charities.map((c) =>
          c._id === id ? { ...c, status: "Rejected" } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-content">
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600 }}>
        Charity Provider Verifications
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : charities.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No charity providers found.</p>
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
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", color: "#374151" }}>
                <th style={{ padding: "12px 16px" }}>No.</th>
                <th style={{ padding: "12px 16px" }}>Name</th>
                <th style={{ padding: "12px 16px" }}>Email</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.map((c, index) => (
                <tr
                  key={c._id}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                  <td style={{ padding: "12px 16px" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px" }}>{c.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          c.status === "Approved"
                            ? "#16a34a"
                            : c.status === "Rejected"
                            ? "#dc2626"
                            : "#f59e0b",
                        backgroundColor:
                          c.status === "Approved"
                            ? "rgba(22,163,74,0.1)"
                            : c.status === "Rejected"
                            ? "rgba(220,38,38,0.1)"
                            : "rgba(245,158,11,0.1)",
                      }}
                    >
                      {c.status || "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {(!c.status || c.status.toLowerCase() === "pending") ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(c._id)}
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
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(c._id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: 13 }}>
                        No actions
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