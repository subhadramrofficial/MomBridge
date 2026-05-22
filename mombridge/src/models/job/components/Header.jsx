import React from "react";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#fff",
    boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
  };

  const logoStyle = {
    fontWeight: "bold",
    fontSize: "1.5rem",
    color: "#007bff",
  };
  const navStyle = { display: "flex", gap: "20px" };
  const linkStyle = {
    textDecoration: "none",
    color: "#333",
    fontWeight: "500",
  };
  const logoutStyle = { ...linkStyle, color: "#dc3545" };

  return (
    <header style={headerStyle}>
      <div style={logoStyle}>MomBridge</div>
      <nav style={navStyle}>
        <a href="/" style={linkStyle}>
          Home
        </a>
        <a href="/jobprovider/my-jobs" style={linkStyle}>
          Jobs
        </a>
        <a href="/job-provider/profile" style={linkStyle}>
          Profile
        </a>
        <a href="/logout" style={logoutStyle}>
          Logout
        </a>
      </nav>
    </header>
  );
};

export default Header;
