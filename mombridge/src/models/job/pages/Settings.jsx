import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "./Settings.css";
import { changePasswordApi } from "../../../service/api";

const Settings = () => {
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    applications: true,
    messages: true,
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const login_id = localStorage.getItem("login_id");

      const res = await changePasswordApi(login_id, passwordData);

      alert(res.data.message);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.response?.data?.error || "Password update failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main className="page-container">
          <div className="settings-container">
            {/* ACCOUNT SETTINGS */}
            <div className="settings-row">
              <div className="settings-card">
                <h3>Account Settings</h3>

                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />

                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />

                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />

                <button className="btn-primary" onClick={handleSavePassword}>
                  Update Password
                </button>
              </div>

              {/* PROFILE */}
              <div className="settings-card">
                <h3>Profile</h3>
                <p>Update your company information and contact details</p>

                <button
                  className="btn-secondary"
                  onClick={() => navigate("/job-provider/profile")}
                >
                  Go to Profile
                </button>
              </div>
            </div>

            {/* LOGOUT */}
            <div className="settings-row center">
              <div className="settings-card danger logout-card">
                <h3>Logout</h3>
                <p>You will be logged out from this device</p>

                <button className="btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
