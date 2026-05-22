import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./AddJob.css"; // reuse same styles
import { getSingleJobApi, updateJobApi } from "../../../service/api";

const EditJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "",
    skills: "",
    salary: "",
    postDate: "",
    lastDate: "",
    status: "Open",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🔹 TEMP MOCK (replace with API later)
  useEffect(() => {
  const fetchJob = async () => {
    try {
      const res = await getSingleJobApi(jobId);

      if (res?.data) {
        setFormData({
          title: res.data.title,
          description: res.data.description,
          jobType: res.data.jobType,
          skills: res.data.skills,
          salary: res.data.salary || "",
          postDate: res.data.postDate,
          lastDate: res.data.lastDate,
          status: res.data.status || "Open",
        });
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      setErrorMsg("❌ Failed to load job details");
    }
  };

  fetchJob();
}, [jobId]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMsg("");
  setSuccessMsg("");

  if (formData.lastDate <= today) {
    setErrorMsg("❌ Last date must be after today");
    return;
  }

  try {
    await updateJobApi(jobId, formData);

    setSuccessMsg("✅ Job updated successfully!");
    setTimeout(() => navigate("/jobprovider/my-jobs"), 1200);
  } catch (error) {
    console.error("Error updating job:", error);
    setErrorMsg("❌ Failed to update job");
  }
};

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main className="page-container">
          <h2>Edit Job</h2>
          <p className="subtitle">Update job details</p>

          {errorMsg && <p className="error-msg">{errorMsg}</p>}
          {successMsg && <p className="success-msg">{successMsg}</p>}

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
              placeholder="Required Skills(comma separated)"
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
              Update Job
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default EditJob;
