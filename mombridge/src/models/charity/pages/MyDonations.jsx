import React, { useEffect, useState } from "react";
import { getMyDonationsApi, deleteDonationApi } from "../../../service/api";
import { useNavigate } from "react-router-dom";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import "./CharityHome.css";
import "./MyDonations.css";
const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const loginId = localStorage.getItem("login_id");
  const navigate = useNavigate();

  const fetchDonations = async () => {
    try {
      const res = await getMyDonationsApi(loginId);
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleDelete = async (donationId) => {
    if (!window.confirm("Are you sure you want to delete this donation?"))
      return;

    try {
      await deleteDonationApi(donationId);
      alert("Donation deleted successfully");
      fetchDonations();
    } catch (err) {
      console.error(err);
      alert("Failed to delete donation");
    }
  };

  return (
    <div className="charity-layout">
      <CharitySidebar />

      <div className="charity-main">
        <CharityHeader />

        <div className="donation-container">
          <div className="donation-header">
            <h2>My Donations</h2>
            <span>{donations.length} total</span>
          </div>

          <div className="donation-card">
            <table className="donation-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {donations.length > 0 ? (
                  donations.map((donation) => (
                    <tr key={donation.id}>
                      <td>
                        {new Date(donation.created_at).toLocaleDateString()}
                      </td>

                      <td className="items-cell">
                        {donation.items.map((item, i) => (
                          <span key={i} className="item-pill">
                            {item.item} × {item.quantity}
                          </span>
                        ))}
                      </td>

                      <td>
                        <span className="mode-badge">
                          {donation.delivery_mode}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${donation.status?.toLowerCase()}`}
                        >
                          {donation.status}
                        </span>
                      </td>

                      <td className="action-buttons">
                        <button
                          className="edit-btn"
                          disabled={donation.status === "collected"}
                          title={
                            donation.status === "collected"
                              ? "Cannot edit a collected donation"
                              : "Edit donation"
                          }
                          onClick={() =>
                            navigate(`/charity/update-donation/${donation.id}`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          disabled={donation.status === "collected"}
                          title={
                            donation.status === "collected"
                              ? "Cannot delete a collected donation"
                              : "Delete donation"
                          }
                          onClick={() => handleDelete(donation.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No donations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDonations;
