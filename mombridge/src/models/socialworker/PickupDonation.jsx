import React, { useEffect, useState } from "react";
import {
  getAllDonationsApi,
  collectDonationApi, // 🔥 new API
} from "../../service/api";
import "./pickup.css";

const PickupDonation = () => {
  const [donations, setDonations] = useState([]);

  const login_id = localStorage.getItem("login_id"); // worker id

  const fetchDonations = async () => {
    try {
      const res = await getAllDonationsApi();
      setDonations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // 🔥 NEW FUNCTION
  const handleCollect = async (donationId) => {
    try {
      await collectDonationApi(donationId, login_id);

      alert("Donation collected successfully");
      fetchDonations(); // refresh
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to collect donation");
    }
  };

  return (
  <div className="pickup-container">
    <h2 className="pickup-title">Pickup Donations</h2>

    <div className="pickup-grid">
      {donations.map((donation) => (
        <div key={donation.id} className="pickup-card">

          <div className="pickup-header">
            <h3>{donation.charity_name}</h3>
            <span
              className={`status ${
                donation.status === "collected" ? "collected" : "pending"
              }`}
            >
              {donation.status}
            </span>
          </div>

          <p><strong>Email:</strong> {donation.charity_email}</p>
          <p><strong>Mode:</strong> {donation.delivery_mode}</p>

          {donation.delivery_mode === "pickup" && (
            <p><strong>Address:</strong> {donation.pickup_address}</p>
          )}

          {donation.delivery_mode === "drop" && (
            <p><strong>Center:</strong> {donation.drop_center}</p>
          )}

          <div className="items">
            <strong>Items:</strong>
            <ul>
              {donation.items?.length > 0 ? (
                donation.items.map((itm, index) => (
                  <li key={index}>
                    {itm.item} - {itm.quantity}
                  </li>
                ))
              ) : (
                <li>No items</li>
              )}
            </ul>
          </div>

          {donation.status !== "collected" && (
            <button
              className="collect-btn"
              onClick={() => handleCollect(donation.id)}
            >
              Collect Donation
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);
};

export default PickupDonation;