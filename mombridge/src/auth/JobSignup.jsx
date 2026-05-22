// src/auth/JobSignup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerJobProviderApi } from "../service/api";
import "./JobSignup.css";

const JobSignup = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    organization_type: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    license_id: "",
    aadhar: "",
  });

  useEffect(() => {
    if (formData.organization_type === "Freelancer") {
      setFormData((prev) => ({ ...prev, license_id: "" }));
    } else if (
      formData.organization_type === "Private" ||
      formData.organization_type === "Government"
    ) {
      setFormData((prev) => ({ ...prev, aadhar: "" }));
    }
  }, [formData.organization_type]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    // Password validation
    // Basic required validation
    if (!formData.company_name.trim()) {
      setMessage("Company name is required");
      setMessageType("error");
      return;
    }

    if (!formData.organization_type) {
      setMessage("Please select organization type");
      setMessageType("error");
      return;
    }

    if (!formData.email.trim()) {
      setMessage("Email is required");
      setMessageType("error");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("Enter a valid email address");
      setMessageType("error");
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage("Phone number must be 10 digits");
      setMessageType("error");
      return;
    }

    // Address
    if (!formData.address.trim()) {
      setMessage("Address is required");
      setMessageType("error");
      return;
    }

    // Password complexity validation

    if (!passwordRegex.test(formData.password)) {
      setMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      );
      setMessageType("error");
      return;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    // Conditional validation
    if (
      formData.organization_type === "Freelancer" &&
      !/^[0-9]{12}$/.test(formData.aadhar)
    ) {
      setMessage("Aadhar must be 12 digits");
      setMessageType("error");
      return;
    }

    if (
      formData.organization_type === "Private" ||
      formData.organization_type === "Government"
    ) {
      const licenseRegex = /^[A-Za-z0-9-]{6,20}$/;

      if (!licenseRegex.test(formData.license_id)) {
        setMessage(
          "License ID must be 6-20 characters and contain only letters, numbers or hyphen.",
        );
        setMessageType("error");
        return;
      }
    }

    try {
      setLoading(true);

      // ✅ SEND JSON (NOT FormData)
      const data = {
        company_name: formData.company_name,
        organization_type: formData.organization_type,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        license_id: formData.license_id,
        aadhar: formData.aadhar,
      };

      // API call
      const response = await registerJobProviderApi(data);

      console.log("Response:", response.data);
      setMessage("Job Provider Registered Successfully!");
      setMessageType("success");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-container">
      <div className="job-card">
        <h2>Job Provider Signup</h2>
        {message && (
          <div className={`form-message ${messageType}`}>{message}</div>
        )}

        <p className="subtitle">
          Register to provide safe and flexible job opportunities for single
          mothers
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="company_name"
            placeholder="Company / Provider Name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />

          <select
            name="organization_type"
            value={formData.organization_type}
            onChange={handleChange}
            required
          >
            <option value="">Organization Type</option>
            <option value="Government">Government</option>
            <option value="Private">Private</option>
            <option value="Freelancer">Freelancer</option>
          </select>
          {/* Freelancer → Show Aadhar */}
          {formData.organization_type === "Freelancer" && (
            <input
              type="text"
              name="aadhar"
              placeholder="Enter Aadhar Number"
              value={formData.aadhar}
              onChange={handleChange}
            />
          )}

          {/* Private or Government → Show License ID */}
          {(formData.organization_type === "Private" ||
            formData.organization_type === "Government") && (
            <input
              type="text"
              name="license_id"
              placeholder="Enter License ID"
              value={formData.license_id}
              onChange={handleChange}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Official Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <textarea
            name="address"
            placeholder="Company Address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? "Registering..." : "Signup as Job Provider"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobSignup;
