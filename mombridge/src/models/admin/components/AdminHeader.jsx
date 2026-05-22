import "./admin.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationsDropdown from "./NotificationsDropdown"; // <-- import the component

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("login_id");
    localStorage.removeItem("usertype");
    navigate("/login");
  };

  // get the logged-in user id from localStorage
  const currentUserId = localStorage.getItem("login_id");

  return (
    <div className="admin-header">
      <h1>Admin Dashboard</h1>

      <div className="admin-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Notifications dropdown */}
        {currentUserId && <NotificationsDropdown userId={currentUserId} />}

        <button className="logout" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}