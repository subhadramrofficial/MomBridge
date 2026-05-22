// src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../service/api";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await loginApi({ email, password });
      console.log("LOGIN RESPONSE:", response.data);
      const { login_id, usertype } = response.data;
      console.log("USERTYPE:", usertype);

      // Store login details
      localStorage.setItem("login_id", login_id);
      localStorage.setItem("usertype", usertype);

      // ✅ ROLE BASED REDIRECT (FIXED PATHS)
      if (usertype === "mom") {
        navigate("/mom/dashboard");
      } else if (usertype === "jobprovider") {
        navigate("/jobprovider/home");
      } else if (usertype === "charityprovider") {
        navigate("/charity/dashboard");
      } else if (usertype === "admin") {
        navigate("/admin/dashboard");
      } else if (usertype === "socialworker") {
        navigate("/socialworker/dashboard");
      } else {
        alert("Unknown user role");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="title">Welcome Back 👋</h2>
        <p className="subtitle">Login to continue to MomBridge</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <label>Email Address</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
          </div>

          {/* 🔗 Forgot Password */}
          <div className="extra-links">
            <span className="link" onClick={() => navigate("/forgot-password")}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* 🔗 Signup */}
        <p className="bottom-text">
          Don’t have an account?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
