// src/models/charity/pages/sponsorship/SponsorChildPage.jsx
import React, { useEffect, useState } from "react";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import {
  getApprovedSponsorshipsApi,
  sponsorChildApi,
} from "../../../service/api";
import "./CharityHome.css"; // use your existing dashboard CSS

export default function SponsorChildPage() {
  const [requests, setRequests] = useState([]);
  const sponsor_id = localStorage.getItem("login_id");

  const loadData = async () => {
    try {
      const res = await getApprovedSponsorshipsApi();
      const data = Array.isArray(res) ? res : res.data || [];
      setRequests(data);
    } catch (err) {
      console.log("Error fetching approved sponsorships:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sponsor = async (id) => {
    try {
      await sponsorChildApi(id, sponsor_id);
      alert("Child sponsored successfully");
      loadData();
    } catch (err) {
      console.log("Error sponsoring child:", err);
      alert("Failed to sponsor child");
    }
  };

  return (
    <div className="charity-layout">
      {/* Sidebar stays fixed */}
      <CharitySidebar />

      {/* Main content */}
      <div className="charity-main">
        {/* Header stays fixed */}
        <CharityHeader />

        {/* SponsorChild content */}
        <h2 className="page-title">Children Needing Sponsorship</h2>

        <div className="charity-content grid-container">
          {requests.length === 0 && (
            <p className="empty-text">
              No approved sponsorship requests available
            </p>
          )}

          {requests.map((req) => (
            <div key={req._id} className="sponsor-card">
              <h3 className="child-name">{req.child_name || "N/A"}</h3>

              <p>
                <span>Amount:</span> ₹{req.amount}
              </p>
              <p>
                <span>Purpose:</span> {req.purpose}
              </p>
              <p>
                <span>Reason:</span> {req.reason}
              </p>

              <button className="sponsor-btn" onClick={() => sponsor(req._id)}>
                Sponsor Child
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
