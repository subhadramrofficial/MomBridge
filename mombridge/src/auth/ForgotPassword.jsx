import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Password.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Token generated. Redirecting...");
      setTimeout(() => {
        navigate("/reset-password", { state: { token: data.token } });
      }, 1500);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="title">Forgot Password</h2>
        <p className="subtitle">Enter your email to reset your password</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email Address</label>
          </div>

          <button className="btn-primary">
            Generate Token
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="bottom-text">
          Remembered your password?{" "}
          <span className="link" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}