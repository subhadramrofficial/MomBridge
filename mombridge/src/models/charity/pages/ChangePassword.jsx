import React, { useState } from "react";
import { changeCharityPasswordApi } from "../../../service/api";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import "./CharityHome.css";

const ChangePassword = () => {
  const login_id = localStorage.getItem("login_id");

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required!");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match!");
      return;
    }

    try {
      setLoading(true);
      const res = await changeCharityPasswordApi(
        login_id,
        form.oldPassword,
        form.newPassword
      );
      setSuccess(res.data.message || "Password changed successfully!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to change password. Try again!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="charity-layout">
      <CharitySidebar />
      <div className="charity-main">
        <CharityHeader />
        <div className="profile-card" style={{ maxWidth: "400px", margin: "30px auto" }}>
          <h3 style={{ marginBottom: "20px" }}>Change Password</h3>
          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="form-group">
              <label>Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Enter old password"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            </div>

            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
            {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}

            <div className="form-group" style={{ marginTop: "20px" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%" }}
              >
                {loading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;