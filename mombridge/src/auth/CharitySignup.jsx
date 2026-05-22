// src/auth/CharitySignup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCharityProviderApi } from "../service/api";
import "./CharitySignup.css";

const CharitySignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organization_name: "",
    address: "",
    email: "",
    phone: "",
    aadhar: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear field error
  };

  // ---------- VALIDATION ----------
  const validate = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const aadharRegex = /^[0-9]{12}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = "Organization name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!aadharRegex.test(formData.aadhar)) {
      newErrors.aadhar = "Aadhaar must be 12 digits";
    }

    if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 6 characters and include a number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!validate()) return;

    try {
      setLoading(true);

      const data = {
        organization_name: formData.organization_name,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        aadhar: formData.aadhar,
        password: formData.password,
      };

      const response = await registerCharityProviderApi(data);
      console.log("CHARITY REGISTER:", response.data);

      setMessage("Charity provider registered successfully!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="charity-container">
      <div className="charity-card">
        <h2>Charity / Donor Signup</h2>
        <p className="subtitle">
          Register your organization to support single mothers
        </p>

        {message && (
          <div className={`form-message ${messageType}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            name="organization_name"
            placeholder="Charity / Organization Name"
            value={formData.organization_name}
            onChange={handleChange}
          />
          {errors.organization_name && (
            <p className="error">{errors.organization_name}</p>
          )}

          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />
          {errors.address && <p className="error">{errors.address}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error">{errors.email}</p>}

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <p className="error">{errors.phone}</p>}

          <input
            name="aadhar"
            placeholder="Aadhaar Number"
            maxLength="12"
            value={formData.aadhar}
            onChange={handleChange}
          />
          {errors.aadhar && <p className="error">{errors.aadhar}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <p className="error">{errors.password}</p>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="error">{errors.confirmPassword}</p>
          )}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? "Registering..." : "Signup as Charity"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CharitySignup;