import React, { useEffect, useState } from "react";
import {
  getPendingJobsApi,
  approveJobApi,
  rejectJobApi,
} from "../../../service/api";
import "../components/JobApprovalPage.css";

export default function JobApprovalPage() {
  const [jobs, setJobs] = useState([]);

  const loadJobs = async () => {
    try {
      const res = await getPendingJobsApi();
      const data = res.data || [];
      setJobs(data);
    } catch (err) {
      console.log("Error loading jobs:", err);
      setJobs([]);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const approve = async (id) => {
    try {
      await approveJobApi(id);
      alert("Job approved successfully");
      loadJobs();
    } catch (err) {
      console.log(err);
      alert("Failed to approve job");
    }
  };

  const reject = async (id) => {
    try {
      await rejectJobApi(id);
      alert("Job rejected");
      loadJobs();
    } catch (err) {
      console.log(err);
      alert("Failed to reject job");
    }
  };
  return (
    <div className="admin-content">
      <h2>Pending Job Approvals</h2>

      {jobs.length === 0 ? (
        <p>No pending jobs</p>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <div key={job.job_id} className="job-card">
              {/* HEADER */}
              <div className="job-header">
                <div>
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name}</p>
                </div>

                <span className="job-type-badge">{job.jobType}</span>
              </div>

              {/* BODY */}
              <div className="job-body-content">
                <p className="job-desc">
                  {job.description.length > 120
                    ? job.description.substring(0, 120) + "..."
                    : job.description}
                </p>

                <div className="job-meta">
                  <span>
                    <b>Salary:</b> {job.salary || "N/A"}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="job-actions">
                <button
                  className="btn-approve"
                  onClick={() => approve(job.job_id)}
                >
                  Approve
                </button>

                <button
                  className="btn-reject"
                  onClick={() => reject(job.job_id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
