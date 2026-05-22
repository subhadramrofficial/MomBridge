import React, { useEffect, useState } from "react";
import {
  getPendingSponsorshipsApi,
  verifySponsorshipApi,
  rejectSponsorshipApi,
  completeSponsorshipApi,
} from "../../service/api";
import "./Sponsorship.css";
export default function SocialWorkerSponsorship() {
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const res = await getPendingSponsorshipsApi();
      console.log("API RESPONSE >>>", res.data);
      setRequests(res.data);
    } catch (err) {
      console.log(err);
      alert("Failed to load sponsorship requests");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const verify = async (id) => {
    try {
      await verifySponsorshipApi(id);
      alert("Request verified");
      loadRequests();
    } catch {
      alert("Verification failed");
    }
  };

  const reject = async (id) => {
    try {
      await rejectSponsorshipApi(id);
      alert("Request rejected");
      loadRequests();
    } catch {
      alert("Reject failed");
    }
  };

  const complete = async (id) => {
    try {
      await completeSponsorshipApi(id);
      alert("Sponsorship completed");
      loadRequests();
    } catch {
      alert("Completion failed");
    }
  };

  return (
    <div className="spon-container">
      <h2 className="spon-title">Sponsorship Tasks</h2>

      {requests.length === 0 ? (
        <p className="empty-text">No sponsorship tasks</p>
      ) : (
        <div className="spon-grid">
          {requests.map((req) => (
            <div key={req._id} className="spon-card">
              {/* Header */}
              <div className="spon-header">
                <h3>{req.type}</h3>

                <span
                  className={`status ${
                    req.status === "completed"
                      ? "done"
                      : req.status === "sponsored"
                        ? "progress"
                        : "pending"
                  }`}
                >
                  {req.status}
                </span>
              </div>
              <div className="mom-info">
                <h4>Name: {req.mom_name}</h4>
                <p>Email: {req.mom_email}</p>
                <p>Phone: {req.mom_phone}</p>
                <p>Address: {req.mom_address}</p>
              </div>
              <p>
                <strong>Amount:</strong> ₹{req.amount}
              </p>
              <p>
                <strong>Purpose:</strong> {req.purpose}
              </p>
              <p>
                <strong>Reason:</strong> {req.reason}
              </p>

              {/* Actions */}
              <div className="spon-actions">
                {req.status === "pending" && (
                  <>
                    <button
                      className="verify-btn"
                      onClick={() => verify(req._id)}
                    >
                      Verify
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => reject(req._id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {req.status === "sponsored" && (
                  <button
                    className="complete-btn"
                    onClick={() => complete(req._id)}
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
