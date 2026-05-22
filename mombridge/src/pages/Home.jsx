import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">MomBridge</h2>

        <div className="nav-buttons">
          <button className="btn-secondary" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn-primary" onClick={() => navigate("/signup")}>
            Signup
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content"> {/* ✅ THIS FIXES YOUR ISSUE */}
          
          <h1>
            Connecting Single Mothers to <br />
            Support & Opportunities
          </h1>

          <p>
            A safe and trusted platform that empowers single mothers through
            jobs, donations, and community-driven support.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-primary large"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>

            <button
              className="btn-outline large"
              onClick={() => navigate("/login")}
            >
              I Have an Account
            </button>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <span className="icon">💼</span>
          <h3>Job Opportunities</h3>
          <p>Flexible and secure part-time jobs designed for single mothers.</p>
        </div>

        <div className="feature-card">
          <span className="icon">🤝</span>
          <h3>Donations & Support</h3>
          <p>Financial and essential help from verified and trusted donors.</p>
        </div>

        <div className="feature-card">
          <span className="icon">🔐</span>
          <h3>Secure & Verified</h3>
          <p>All users go through verification to ensure safety and trust.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        © 2026 MomBridge · Empowering Mothers, Building Futures
      </footer>
    </div>
  );
};

export default Home;