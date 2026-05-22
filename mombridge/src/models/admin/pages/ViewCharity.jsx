// src/admin/AdminCharities.jsx
import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { getadminCharityApi } from "../../../service/api";
import "../components/Admin.css";

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const res = await getadminCharityApi();
      setCharities(res.data || []);
    } catch (err) {
      console.error("Fetch charities error:", err);
      alert("Unable to fetch charities");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content">
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 600 }}>
        Charity Contributions
      </h2>

      {loading ? (
        <p>Loading charities...</p>
      ) : charities.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No charity records found.</p>
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
                <th style={{ padding: "12px 16px" }}>Provider Name</th>
                <th style={{ padding: "12px 16px" }}>Items</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Created At</th>
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
                  <td style={{ padding: "12px 16px" }}>{c.organization_name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {c.items.map((i, idx) => (
                      <div key={idx}>
                        {i.item} × {i.quantity}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          c.status === "collected"
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
                    {new Date(c.created_at).toLocaleDateString()}
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
