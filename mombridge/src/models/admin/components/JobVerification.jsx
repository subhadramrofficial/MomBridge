// src/admin/JobVerification.jsx
import { useState, useEffect } from "react";
import {
  getAllJobProvidersApi,
  approveJobProviderApi,
  rejectJobProviderApi,
} from "../../../service/api";
import "../components/Admin.css";

export default function JobVerification() {
  const [jobProviders, setJobProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobProviders();
  }, []);

  const fetchJobProviders = async () => {
    try {
      const res = await getAllJobProvidersApi();
      // Map response to include fields from tbl_jobprovider
      const mappedProviders = (res.data.data || []).map((p) => ({
        _id: p._id,
        email: p.email,
        status: p.status,
        company_name: p.company_name || "—",
        organization_type: p.organization_type || "—",
        license_id: p.license_id || "—",
      }));
      setJobProviders(mappedProviders);
    } catch (err) {
      console.error("Error fetching job providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await approveJobProviderApi(id);
      if (res.status === 200) {
        setJobProviders(
          jobProviders.map((j) =>
            j._id === id ? { ...j, status: "Approved" } : j,
          ),
        );
      } else alert("Failed to approve. Try again.");
    } catch (err) {
      console.error(err);
      alert("Error approving provider. Check console.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectJobProviderApi(id);
      setJobProviders(
        jobProviders.map((j) =>
          j._id === id ? { ...j, status: "Rejected" } : j,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-content">
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600 }}>
        Job Provider Verifications
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : jobProviders.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No job providers found.</p>
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
                <th style={{ padding: "12px 16px" }}>Company Name</th>
                <th style={{ padding: "12px 16px" }}>Organization Type</th>
                <th style={{ padding: "12px 16px" }}>License ID</th>
                <th style={{ padding: "12px 16px" }}>Email</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobProviders.map((j, index) => (
                <tr
                  key={j._id}
                  style={{ backgroundColor: "#f9fafb", borderRadius: 8 }}
                >
                  <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                  <td style={{ padding: "12px 16px" }}>{j.company_name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {j.organization_type}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{j.license_id}</td>
                  <td style={{ padding: "12px 16px" }}>{j.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          j.status === "Approved"
                            ? "#16a34a"
                            : j.status === "Rejected"
                              ? "#dc2626"
                              : "#f59e0b",
                        backgroundColor:
                          j.status === "Approved"
                            ? "rgba(22,163,74,0.1)"
                            : j.status === "Rejected"
                              ? "rgba(220,38,38,0.1)"
                              : "rgba(245,158,11,0.1)",
                      }}
                    >
                      {j.status || "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {!j.status || j.status.toLowerCase() === "pending" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(j._id)}
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
                          onClick={() => handleReject(j._id)}
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
