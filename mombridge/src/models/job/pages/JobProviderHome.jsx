import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import JobCard from "../components/JobCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JobProviderHome = () => {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();
  const loginId = localStorage.getItem("login_id");

  // ✅ Fetch Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/jobs/${loginId}`
        );
        setJobs(res.data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    if (loginId) {
      fetchJobs();
    }
  }, [loginId]);

  // ✅ Edit
  const handleEdit = (jobId) => {
    navigate(`/jobprovider/job/${jobId}`);

  };

  // ✅ Delete
  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:5000/jobprovider/delete-job/${jobId}`
      );

      // remove from UI immediately
      setJobs((prevJobs) =>
        prevJobs.filter((job) => job._id !== jobId)
      );
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ✅ Only 4 Most Recent Jobs
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
    .slice(0, 4);

  const handleAddJob = () => {
    navigate("/jobprovider/add-job");
  };

  const mainStyle = {
    flex: 1,
    padding: "40px 30px",
  };

  const introStyle = {
    backgroundColor: "#fff",
    padding: "40px 20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    textAlign: "center",
    marginBottom: "30px",
  };

  const addBtnStyle = {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "12px 25px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "15px",
  };

  const jobsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
    gap: "20px",
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main style={mainStyle}>
          <section style={introStyle}>
            <h1>Welcome, Job Provider!</h1>
            <p>
              Post part-time or freelance opportunities and support single
              mothers in your community.
            </p>
            <button style={addBtnStyle} onClick={handleAddJob}>
              Add New Job
            </button>
          </section>

          {recentJobs.length === 0 ? (
            <p>You haven’t added any jobs yet.</p>
          ) : (
            <div style={jobsGridStyle}>
              {recentJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onEdit={() => handleEdit(job._id)}
                  onDelete={() => handleDelete(job._id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default JobProviderHome;
