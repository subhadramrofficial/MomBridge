// src/auth/Signup.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="signup-container">
      <h1>Join MomBridge</h1>
      <p className="subtitle">
        Choose how you would like to be a part of the MomBridge community
      </p>

      <div className="signup-options">
        {/* Charity Signup */}
        <div
          className="signup-card"
          onClick={() => navigate('/signup/charity')}
        >
          <div className="icon">🤝</div>
          <h3>Charity / Donor Signup</h3>
          <p>
            Support single mothers by donating funds, resources, or opportunities.
          </p>
        </div>

        {/* Job Signup */}
        <div
          className="signup-card"
          onClick={() => navigate('/signup/job')}
        >
          <div className="icon">💼</div>
          <h3>Job Provider Signup</h3>
          <p>
            Support single mothers by offering safe and flexible job opportunities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
