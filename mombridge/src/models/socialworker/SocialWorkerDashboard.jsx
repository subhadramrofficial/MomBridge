import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./SocialWorkerDashboard.css";
import NotificationSocial from "./NotificationSocial";

const SocialWorkerDashboard = () => {
  const navigate = useNavigate();
  const loginId = localStorage.getItem("login_id");

  const handleLogout = () => {
    localStorage.removeItem("login_id");
    localStorage.removeItem("usertype");
    navigate("/login");
  };

  return (
    <div className="sw-dashboard">

      {/* Sidebar */}
      <aside className="sw-sidebar">
        <h2>Social Worker</h2>

        <nav>
          <NavLink to="" end className={({ isActive }) => isActive ? "active" : ""}>
            Dashboard
          </NavLink>

          <NavLink to="pickup" className={({ isActive }) => isActive ? "active" : ""}>
            Pickup Donation
          </NavLink>

          <NavLink to="give" className={({ isActive }) => isActive ? "active" : ""}>
            Give Donation
          </NavLink>

          <NavLink to="verify-moms" className={({ isActive }) => isActive ? "active" : ""}>
            Verify Moms
          </NavLink>

          <NavLink to="sponsored-children" className={({ isActive }) => isActive ? "active" : ""}>
            Sponsorship Verify
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="sw-logout-btn">
          Logout
        </button>
      </aside>

      {/* Main */}
      <div className="sw-main">
        <header className="sw-header">
          <h1>Dashboard</h1>
          <NotificationSocial userId={loginId} />
        </header>

        <main className="sw-content">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default SocialWorkerDashboard;