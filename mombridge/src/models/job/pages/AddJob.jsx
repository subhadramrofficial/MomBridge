import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./AddJob.css";
import { AddJobApi } from "../../../service/api";

const AddJob = () => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000)
  .toISOString()
  .split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "",
    skills: "",
    salary: "",
    postDate: today,
    lastDate: "",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    
    if (formData.lastDate <= today) {
    setErrorMsg("❌ Last date must be after today");
    return;
  }
    try {
      // ✅ GET LOGIN ID FROM LOCAL STORAGE
      const login_id = localStorage.getItem("login_id");

      if (!login_id) {
        setErrorMsg("❌ Login expired. Please login again.");
        return;
      }

      // ✅ THIS IS THE MISSING PIECE
      const data = {
        ...formData,
        login_id,
      };

      const response = await AddJobApi(data);

      if (response.status === 201) {
        setSuccessMsg("✅ Job posted successfully!");

        setFormData({
          title: "",
          description: "",
          jobType: "",
          skills: "",
          salary: "",
          postDate: "",
          lastDate: "",
        });
      }
    } catch (error) {
      console.error("Add job error:", error);
      setErrorMsg("❌ Failed to post job. Please try again.");
    }
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main className="page-container">
          <h2>Add New Job</h2>
          <p className="subtitle">
            Create a job opportunity for single mothers
          </p>

          {successMsg && <p className="success-msg">{successMsg}</p>}
          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          <form className="job-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Job Title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Job Description"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              required
            >
              <option value="">Select Job Type</option>
              <option value="Part-time">Part-time</option>
              <option value="Full-time">Full-time</option>
              <option value="Freelance">Freelance</option>
              <option value="Remote">Remote</option>
            </select>

            <input
              type="text"
              name="skills"
              placeholder="Required Skills (comma separated)"
              value={formData.skills}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="salary"
              placeholder="Salary / Payment"
              value={formData.salary}
              onChange={handleChange}
            />

            <div className="date-group">
              <div>
                <label>Post Date</label>
                <input
                  type="date"
                  name="postDate"
                  value={formData.postDate}
                  disabled
                />
              </div>

              <div>
                <label>Last Date</label>
                <input
                  type="date"
                  name="lastDate"
                  value={formData.lastDate}
                  onChange={handleChange}
                  min={tomorrow}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Post Job
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddJob;
