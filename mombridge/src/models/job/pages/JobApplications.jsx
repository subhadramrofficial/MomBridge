import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./JobApplications.css"
import axios from "axios";

const JobApplications = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/jobprovider/job/${jobId}/applications`
        );
        setApplications(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchApplications();
  }, [jobId]);

  return (
  <div className="job-layout">
    <Header />

    <div className="job-body">
      <Sidebar />

      <main className="page-container">
        <h2>Applications</h2>

        {applications.length === 0 ? (
          <p className="empty-msg">No applications yet.</p>
        ) : (
          <div className="applications-grid">
  {applications.map((app) => (
    <div className="application-card" key={app.application_id}>
      
      {/* TOP */}
      <div className="card-header">
        <h3>{app.mom_name}</h3>
        <span className={`status ${app.status}`}>
          {app.status || "pending"}
        </span>
      </div>

      {/* BODY */}
      <div className="card-body">
        <div className="info-row">
          <span>Email</span>
          <p>{app.email}</p>
        </div>

        <div className="info-row">
          <span>Phone</span>
          <p>{app.contact || "N/A"}</p>
        </div>

        <div className="info-row">
          <span>Cover Letter</span>
          <p className="cover-text">{app.cover_letter}</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="card-footer">
        <a
          href={`http://localhost:5000/uploads/resumes/${app.resume}`}
          target="_blank"
          rel="noreferrer"
          className="btn-view"
        >
          View Resume
        </a>
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

export default JobApplications;
