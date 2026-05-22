// src/admin/CreateSocialWorker.jsx
import React, { useState } from "react";
import { createSocialWorkerApi, getSocialWorkersApi } from "../../../service/api";

const CreateSocialWorker = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = form;
    if (!name || !email || !password) return alert("All fields are required");

    try {
      setLoading(true);
      await createSocialWorkerApi({ name, email, password });
      alert(`Social worker created!\nEmail: ${email}\nPassword: ${password}`);
      setForm({ name: "", email: "", password: "" });
      if (showWorkers) fetchWorkers(); // refresh list if visible
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to create social worker");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const workersList = await getSocialWorkersApi();
      setWorkers(workersList);
      setShowWorkers(true);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch social workers");
    } finally {
      setLoadingWorkers(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "50px auto", padding: 24 }}>
      {/* Form Card */}
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          backgroundColor: "#fff",
          boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
          Create Social Worker
        </h2>

        <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: "12px 14px", borderRadius: 6, border: "1px solid #ccc", outline: "none", fontSize: 14 }}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            style={{ padding: "12px 14px", borderRadius: 6, border: "1px solid #ccc", outline: "none", fontSize: 14 }}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={{ padding: "12px 14px", borderRadius: 6, border: "1px solid #ccc", outline: "none", fontSize: 14 }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              marginTop: 8,
              borderRadius: 6,
              backgroundColor: "#3b82f6",
              color: "#fff",
              fontWeight: 500,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "0.2s",
            }}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {/* Workers List Card */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          backgroundColor: "#fff",
          boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={fetchWorkers}
          disabled={loadingWorkers}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 6,
            backgroundColor: "#22c55e",
            color: "#fff",
            fontWeight: 500,
            border: "none",
            cursor: loadingWorkers ? "not-allowed" : "pointer",
            marginBottom: 16,
            transition: "0.2s",
          }}
        >
          {loadingWorkers ? "Loading..." : showWorkers ? "Refresh List" : "View Social Workers"}
        </button>

        {showWorkers && (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {workers.length > 0 ? (
              <ul style={{ padding: 0, listStyle: "none" }}>
                {workers.map((w, idx) => (
                  <li
                    key={w._id || idx}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #e5e7eb",
                      borderRadius: 6,
                      marginBottom: 4,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0f2fe")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                  >
                    {w.name} {/* Only name displayed now */}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: "center", color: "#6b7280" }}>No social workers found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSocialWorker;