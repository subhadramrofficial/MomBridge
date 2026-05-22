// src/socialworker/GiveDonation.jsx
import React, { useEffect, useState } from "react";
import "./give.css";
const GiveDonation = () => {
  const [requests, setRequests] = useState([]);

  const workerId = localStorage.getItem("login_id");

  // 🔹 Fetch assigned charity
  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/socialworker/assigned-charity/${workerId}`,
      );

      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 🔹 Mark delivered
  const markDelivered = async (requestId) => {
    try {
      await fetch(
        `http://localhost:5000/socialworker/mark-delivered/${requestId}`,
        {
          method: "PUT",
        },
      );

      alert("Marked as delivered ✅");
      fetchRequests(); // refresh
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  return (
    <div className="give-container">
      <h2 className="give-title">Give Donation</h2>

      {requests.length === 0 ? (
        <p className="empty-text">No assigned charity work</p>
      ) : (
        <div className="give-grid">
          {requests.map((req) => (
            <div key={req.request_id} className="give-card">
              <div className="give-header">
                <span
                  className={`status ${
                    req.status === "delivered" ? "done" : "pending"
                  }`}
                >
                  {req.status}
                </span>
              </div>
              <div className="mom-info">
                <h4>{req.mom_name}</h4>
                <p>{req.mom_address}</p>
                <p>{req.mom_email}</p>
                <p>{req.mom_phone}</p>
              </div>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(req.created_at).toLocaleDateString()}
              </p>

              <div className="items">
                <strong>Items:</strong>
                <ul>
                  {req.items?.map((item, index) => (
                    <li key={index}>
                      {item.item} - {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {req.status === "assigned" && (
                <button
                  className="deliver-btn"
                  onClick={() => markDelivered(req.request_id)}
                >
                  Mark Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiveDonation;
