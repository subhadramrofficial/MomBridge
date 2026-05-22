import React, { useEffect, useState } from "react";
import { getPendingMoms, verifyMom, rejectMom } from "../../service/api";
import "./verify.css";

const VerifyMoms = () => {
  const [moms, setMoms] = useState([]);

  useEffect(() => {
    fetchPendingMoms();
  }, []);

  const fetchPendingMoms = async () => {
    try {
      const res = await getPendingMoms();
      setMoms(res.data || []);
    } catch (err) {
      console.log("Fetch moms error", err);
    }
  };

  const handleVerify = async (id) => {
    try {
      await verifyMom(id);
      fetchPendingMoms();
    } catch (err) {
      console.log("Verify error", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectMom(id); // 🔥 backend API
      fetchPendingMoms();
    } catch (err) {
      console.log("Reject error", err);
    }
  };

  return (
    <div className="verify-container">
      <h2 className="verify-title">Verify Moms</h2>

      {moms.length === 0 ? (
        <p className="empty-text">No pending moms</p>
      ) : (
        <div className="verify-grid">
          {moms.map((mom) => (
            <div key={mom._id} className="verify-card">

              <div className="verify-header">
                <h3>{mom.name}</h3>
              </div>

              <p><strong>Address:</strong> {mom.address}</p>
              <p><strong>Contact:</strong> {mom.contact}</p>

              <div className="verify-actions">
                <button
                  className="verify-btn"
                  onClick={() => handleVerify(mom._id)}
                >
                  Approve
                </button>

                <button
                  className="reject-btn"
                  onClick={() => handleReject(mom._id)}
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
};

export default VerifyMoms;