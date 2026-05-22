import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const sidebarStyle = {
    width: "220px",
    backgroundColor: "#fff",
    padding: "30px 20px",
    boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#333",
    fontWeight: "500",
    fontSize: "1rem",
    padding: "10px 5px",
    borderRadius: "5px",
  };

  return (
    <aside style={sidebarStyle}>
      <Link to="/jobprovider/home" style={linkStyle}>
        Dashboard
      </Link>
      <Link to="/jobprovider/add-job" style={linkStyle}>
        Post a Job
      </Link>
      <Link to="/jobprovider/applications" style={linkStyle}>
        Applications
      </Link>
      <Link to="/job-provider/profile" style={linkStyle}>
        Edit Profile
      </Link>
      <Link to="/jobprovider/settings" style={linkStyle}>
        Settings
      </Link>
    </aside>
  );
};

export default Sidebar;
