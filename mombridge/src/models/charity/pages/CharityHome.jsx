import React, { useEffect, useState } from "react";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import "./CharityHome.css";
import { useNavigate } from "react-router-dom";

const CharityHome = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    total: 0,
    pending: 0,
    collected: 0,
  });

  const loginId = localStorage.getItem("login_id");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/charity/dashboard/${loginId}`
        );
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboard();
  }, [loginId]);

  return (
    <div className="charity-layout">
      <CharitySidebar />

      <div className="charity-main">
        <CharityHeader />

        <div className="dashboard-content">
          {/* Welcome */}
          <div className="dashboard-welcome">
            <h2>Welcome back 👋</h2>
            <p>Manage your donations and sponsorship activities from here.</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Donations</h4>
              <p>{data.total}</p>
            </div>

            <div className="stat-card">
              <h4>Pending</h4>
              <p>{data.pending}</p>
            </div>

            <div className="stat-card">
              <h4>Collected</h4>
              <p>{data.collected}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="two-cards">
            <div
              className="card clickable"
              onClick={() => navigate("/charity/donations")}
            >
              <h3>Manage Donations</h3>
              <p>View, track, and manage all donations.</p>
            </div>

            <div
              className="card clickable"
              onClick={() => navigate("/charity/sponsor-child")}
            >
              <h3>Manage Sponsorship</h3>
              <p>Handle sponsorship programs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharityHome;