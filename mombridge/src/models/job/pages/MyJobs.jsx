import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { getJobsByProviderApi, deleteJobApi } from "../../../service/api";
import { useNavigate } from "react-router-dom";
import "./MyJobs.css";

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const login_id = localStorage.getItem("login_id");

        if (!login_id) {
          setErrorMsg("Login expired. Please login again.");
          return;
        }

        const response = await getJobsByProviderApi(login_id);
        setJobs(response.data);
      } catch (error) {
        console.error(error);
        setErrorMsg("Failed to load jobs");
      }
    };

    fetchJobs();
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      const response = await deleteJobApi(jobId);

      if (response.status === 200) {
        navigate(0); // 🔁 refresh current route cleanly
      }
    } catch (error) {
      console.log(error.response);
      console.error("Delete job error:", error);
      alert("❌ Failed to delete job");
    }
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main className="page-container">
          <h2>My Posted Jobs</h2>

          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          {jobs.length === 0 ? (
            <p className="empty-msg">No jobs posted yet.</p>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div className="job-card" key={job._id}>
                  <h3>{job.title}</h3>
                  <p className="job-type">{job.jobType}</p>
                  <p className="job-desc">
                    {job.description.length > 120
                      ? job.description.substring(0, 120) + "..."
                      : job.description}
                  </p>

                  <div className="job-meta">
                    <span>
                      <b>Skills:</b> {job.skills}
                    </span>
                    <span>
                      <b>Salary:</b> {job.salary || "N/A"}
                    </span>
                  </div>

                  <div className="job-dates">
                    <span>
                      <b>Posted:</b> {job.postDate}
                    </span>
                    <span>
                      <b>Last Date:</b> {job.lastDate}
                    </span>
                  </div>

                  {/* ✅ ACTION BUTTONS */}
                  <div className="job-actions">
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/jobprovider/job/${job._id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(job._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn-view"
                      onClick={() =>
                        navigate(`/jobprovider/job/${job._id}/applications`)
                      }
                    >
                      View Applications
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyJobs;
