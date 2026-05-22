import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import "../components/Admin.css";

export default function DashboardHome() {
  const [data, setData] = useState({});

  useEffect(() => {
  // 1️⃣ Fetch Dashboard Data
  fetch("http://localhost:5000/admin/dashboard")
    .then((res) => res.json())
    .then((res) => {
      setData(res);
    })
    .catch((err) => console.error("Dashboard fetch error:", err));

  // 2️⃣ Fetch Admin Notification Counts
  fetch("http://localhost:5000/admin/notifications-count/admin_id_here")
    .then((res) => res.json())
    .then((res) => {
      setNotificationCounts(res);
    })
    .catch((err) => console.error("Notification count fetch error:", err));

  // ✅ Optionally, refresh notifications every 30 seconds
  const interval = setInterval(() => {
    fetch("http://localhost:5000/admin/notifications-count/admin_id_here")
      .then((res) => res.json())
      .then((res) => setNotificationCounts(res))
      .catch((err) =>
        console.error("Notification count refresh error:", err)
      );
  }, 30000);

  return () => clearInterval(interval); // cleanup on unmount
}, []);

  // ================= PIE DATA =================
  const charityPieData = [
    { name: "Pending", value: data.pending || 0, fill: "#f59e0b" },
    { name: "Assigned", value: data.assigned || 0, fill: "#3b82f6" },
    { name: "Completed", value: data.completed || 0, fill: "#22c55e" },
  ];

  const sponsorPieData = [
    { name: "Pending", value: data.sponsorship_pending || 0, fill: "#f59e0b" },
    { name: "Accepted", value: data.sponsorship_accepted || 0, fill: "#6366f1" },
    { name: "Rejected", value: data.sponsorship_rejected || 0, fill: "#ef4444" },
    { name: "Sponsored", value: data.sponsorship_sponsored || 0, fill: "#a855f7" },
    { name: "Completed", value: data.sponsorship_completed || 0, fill: "#22c55e" },
  ];

  const inventoryData =
    data.inventory &&
    Object.entries(data.inventory)
      .filter(([k]) => k !== "_id")
      .map(([key, val]) => ({
        name: key,
        value: val,
      }));

  const totalRequests = data.total_requests || 0;
  const completionRate =
    totalRequests > 0
      ? Math.round((data.completed / totalRequests) * 100)
      : 0;

  return (
    <div className="admin-page">
      <h2 className="page-title">📊 Admin Dashboard</h2>

      {/* ================= QUICK INSIGHTS ================= */}
      <div className="section-card">
        <h3>🚀 Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card warning">
            Pending Requests: {data.pending || 0}
          </div>
          <div className="insight-card info">
            Sponsorship Pending: {data.sponsorship_pending || 0}
          </div>
          <div className="insight-card success">
            Completed: {data.completed || 0}
          </div>
          <div className="insight-card alert">
            Inventory Types: {inventoryData?.length || 0}
          </div>
        </div>
      </div>

      {/* ================= CHARITY ================= */}
      <div className="section-card">
  <h3>🤝 Charity Requests</h3>

  <div className="row-layout">
    {/* LEFT → STATS */}
    <div className="left-panel">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total</h4>
          <p>{data.total_requests || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Pending</h4>
          <p>{data.pending || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Assigned</h4>
          <p>{data.assigned || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Completed</h4>
          <p>{data.completed || 0}</p>
        </div>
      </div>
    </div>

    {/* RIGHT → CHART */}
    <div className="right-panel">
      <h4>Status Overview</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={charityPieData} dataKey="value" outerRadius={90} label />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>

      {/* ================= SPONSORSHIP ================= */}
     <div className="section-card">
  <h3>🎯 Sponsorship Requests</h3>

  <div className="row-layout">
    {/* LEFT */}
    <div className="left-panel">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total</h4>
          <p>{data.total_sponsorships || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Pending</h4>
          <p>{data.sponsorship_pending || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Accepted</h4>
          <p>{data.sponsorship_accepted || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Rejected</h4>
          <p>{data.sponsorship_rejected || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Sponsored</h4>
          <p>{data.sponsorship_sponsored || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Completed</h4>
          <p>{data.sponsorship_completed || 0}</p>
        </div>
      </div>
    </div>

    {/* RIGHT */}
    <div className="right-panel">
      <h4>Status Overview</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={sponsorPieData} dataKey="value" outerRadius={90} label />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>
      

      {/* ================= INVENTORY ================= */}
      <div className="section-card">
        <h3>📦 Inventory</h3>

        <div className="stats-grid">
          {inventoryData?.length ? (
            inventoryData.map((item, i) => (
              <div className="stat-card" key={i}>
                <h4>{item.name}</h4>
                <p>{item.value}</p>
              </div>
            ))
          ) : (
            <p>No inventory data</p>
          )}
        </div>

        <div className="chart-box">
          <h4>Inventory Analytics</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ff9800" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= WORKERS =================
      <div className="section-card">
        <h3>👷 Worker Activity</h3>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assigned</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.workers?.length ? (
              data.workers.map((w, i) => (
                <tr key={i}>
                  <td>{w.name}</td>
                  <td>{w.assigned}</td>
                  <td>{w.completed}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No worker data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div> */}
    </div>
  );
}