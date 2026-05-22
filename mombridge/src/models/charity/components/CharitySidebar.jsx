// src/models/charity/components/CharitySidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../pages/CharityHome.css";

const CharitySidebar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  return (
    <aside className="charity-sidebar">
      <h3 className="logo">MomBridge</h3>

      <nav>
        <a onClick={() => navigate("/charity/dashboard")}>Dashboards</a>
        <a onClick={() => navigate("/charity/sponsor-child")}>Sponsor Child</a>
        <a onClick={() => navigate("/charity/view-sponsored-children")}>My Sponsored Children</a>
        <a onClick={() => navigate("/charity/donations")}>Donations</a>
        <a onClick={() => navigate("/charity/my-donations")}>My Donations</a>
        <a onClick={() => navigate("/charity/profile")}>Profile</a>
        <a className="logout" onClick={handleLogout}>
          Logout
        </a>
      </nav>
    </aside>
  );
};

export default CharitySidebar;
