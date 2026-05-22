import { useEffect, useState } from "react";
import {
  getSponsorshipRequestsApi,
  approveSponsorshipApi,
  rejectSponsorshipApi,
  completeSponsorshipApi
} from "../../../service/api";

export default function ViewSponsorshipRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await getSponsorshipRequestsApi();
      setRequests(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const approve = async (id) => {
    await approveSponsorshipApi({ request_id: id });
    fetchRequests();
  };

  const reject = async (id) => {
    await rejectSponsorshipApi({ request_id: id });
    fetchRequests();
  };

  const completeSponsorship = async (id) => {
    await completeSponsorshipApi(id);
    fetchRequests();
  };

  return (
    <div className="admin-content">
      <h2 style={{ marginBottom: 20 }}>Sponsorship Requests</h2>

      {requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            background: "#fff",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
              minWidth: 900,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 12 }}>No.</th>
                <th style={{ padding: 12 }}>Child Name</th>
                <th style={{ padding: 12 }}>Mother Name</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Purpose</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((req, index) => (
                <tr
                  key={req._id}
                  style={{
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <td style={{ padding: 12 }}>{index + 1}</td>

                  <td style={{ padding: 12 }}>
                    {req.child_name || "-"}
                  </td>

                  <td style={{ padding: 12 }}>
                    {req.mom_name || "-"}
                  </td>

                  <td style={{ padding: 12 }}>₹{req.amount}</td>

                  <td style={{ padding: 12 }}>{req.purpose}</td>

                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color:
                          req.status === "verified"
                            ? "#f59e0b"
                            : req.status === "sponsored"
                            ? "#3b82f6"
                            : "#16a34a",
                      }}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td style={{ padding: 12 }}>
                    {req.status === "verified" && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => approve(req._id)}
                        >
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => reject(req._id)}
                          style={{ marginLeft: 8 }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {req.status === "sponsored" && (
                      <button
                        onClick={() => completeSponsorship(req._id)}
                        style={{
                          background: "#16a34a",
                          color: "#fff",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Complete
                      </button>
                    )}

                    {req.status === "completed" && (
                      <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                        Completed ✅
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}