import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Password.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(location.state?.token || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Password reset successful");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="title">Reset Password 🔐</h2>
        <p className="subtitle">Enter your token and new password</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder=" "
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <label>Reset Token</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>New Password</label>
          </div>

          <button className="btn-primary full" type="submit">
            Reset Password
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="bottom-text">
          Back to{" "}
          <span className="link" onClick={() => navigate("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}