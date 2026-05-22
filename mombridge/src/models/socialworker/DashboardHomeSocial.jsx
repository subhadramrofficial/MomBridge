import React, { useEffect, useState } from "react";
import "./DashboardHome.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardHome() {
  const [data, setData] = useState({
    total_pickups: 0,
    pending_verifications: 0,
    donations_given: 0,
  });

  const loginId = localStorage.getItem("login_id");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/socialworker/dashboard/${loginId}`
        );
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboard();
  }, [loginId]);

  const chartData = [
    { name: "Pickups", value: data.total_pickups },
    { name: "Verifications", value: data.pending_verifications },
    { name: "Donations", value: data.donations_given },
  ];

  return (
    <div className="sw-dashboard-home">

      {/* Stats */}
      <div className="sw-stats">
        <div className="sw-card">
          <h3>Total Pickups</h3>
          <p>{data.total_pickups}</p>
        </div>

        <div className="sw-card">
          <h3>Pending Verifications</h3>
          <p>{data.pending_verifications}</p>
        </div>

        <div className="sw-card">
          <h3>Donations Given</h3>
          <p>{data.donations_given}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="sw-chart-card">
        <h3>Activity Overview</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}