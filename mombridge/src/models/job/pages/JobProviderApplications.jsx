import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import {
  getJobApplicationsApi,
  updateApplicationStatusApi,baseURL,
} from "../../../service/api";

const JobProviderApplications = () => {
  const [applications, setApplications] = useState([]);
  const loginId = localStorage.getItem("login_id");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await getJobApplicationsApi(loginId);
      setApplications(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await updateApplicationStatusApi(applicationId, status);

      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === applicationId ? { ...app, status } : app,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const mainStyle = {
    flex: 1,
    padding: "40px 30px",
  };

  const cardStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  };

  const btnStyle = {
    padding: "8px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginRight: "10px",
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main style={mainStyle}>
          <h2>Job Applications</h2>

         {applications.length === 0 ? (
  <p className="empty-msg">No applications yet.</p>
) : (
  <div className="applications-grid">
    {applications.map((app) => (
      <div className="application-card" key={app.application_id}>
        
        {/* HEADER */}
        <div className="card-header">
          <div>
            <h3>{app.job_title}</h3>
            <p className="applicant-name">{app.mom_name}</p>
          </div>

          <span className={`status ${app.status}`}>
            {app.status}
          </span>
        </div>

        {/* BODY */}
        <div className="card-body">
          <div className="info-row">
            <span>Email</span>
            <p>{app.mom_email}</p>
          </div>

          <div className="info-row">
            <span>Phone</span>
            <p>{app.mom_phone}</p>
          </div>

          <div className="info-row">
            <span>Cover Letter</span>
            <p className="cover-text">{app.cover_letter}</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="card-footer">
          {app.resume && (
            <a
              href={`${baseURL}/uploads/resumes/${app.resume}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view"
            >
              View Resume
            </a>
          )}

          {app.status === "pending" && (
            <div className="action-buttons">
              <button
                className="btn-approve"
                onClick={() =>
                  updateStatus(app.application_id, "approved")
                }
              >
                Approve
              </button>

              <button
                className="btn-reject"
                onClick={() =>
                  updateStatus(app.application_id, "rejected")
                }
              >
                Reject
              </button>
            </div>
          )}
        </div>

      </div>
    ))}
  </div>
)}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default JobProviderApplications;
