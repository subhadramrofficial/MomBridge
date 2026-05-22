import React, { useEffect, useState } from "react";
import { getVerifiedMomsApi } from "../../../service/api"; // create this API
import "../components/Admin.css";

export default function VerifiedMomsPage() {
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMom, setSelectedMom] = useState(null);

  useEffect(() => {
    const fetchMoms = async () => {
      try {
        const res = await getVerifiedMomsApi(); // fetch verified moms
        setMoms(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch verified moms");
      } finally {
        setLoading(false);
      }
    };

    fetchMoms();
  }, []);

  return (
    <div className="admin-page">
      <h2 className="page-title">👩‍👧 Verified Moms</h2>

      {loading ? (
        <p>Loading moms...</p>
      ) : moms.length === 0 ? (
        <p>No verified moms found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th>DOB</th>
              <th>Aadhaar</th>
              <th>Children</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {moms.map((mom) => (
              <tr key={mom._id}>
                <td>{mom.name}</td>
                <td>{mom.contact}</td>
                <td>{mom.address}</td>
                <td>{mom.dob}</td>
                <td>{`XXXX XXXX ${mom.aadhar?.slice(-4)}`}</td>
                <td>{mom.children?.length || 0}</td>
                <td>
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedMom(mom)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for mom details */}
      {selectedMom && (
        <div className="modal-backdrop" onClick={() => setSelectedMom(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3>{selectedMom.name} — Details</h3>
            <div className="modal-section">
              <p>
                <strong>Contact:</strong> {selectedMom.contact}
              </p>
              <p>
                <strong>Address:</strong> {selectedMom.address}
              </p>
              <p>
                <strong>Date of Birth:</strong> {selectedMom.dob}
              </p>
              <p>
                <strong>Aadhaar:</strong>{" "}
                {`XXXX XXXX ${selectedMom.aadhar?.slice(-4)}`}
              </p>
            </div>

            <h4>Children</h4>
            {selectedMom.children && selectedMom.children.length > 0 ? (
              <div className="children-list">
                {selectedMom.children.map((child, idx) => (
                  <div key={child._id || idx} className="child-card">
                    <p>
                      <strong>Name:</strong> {child.name}
                    </p>
                    <p>
                      <strong>Age:</strong> {child.age}
                    </p>
                    <p>
                      <strong>Gender:</strong> {child.gender}
                    </p>
                    <p>
                      <strong>School:</strong>{" "}
                      {child.is_school_going ? child.school_name : "Not going"}
                    </p>
                    <p>
                      <strong>Birth Certificate:</strong>{" "}
                      <a
                        href={`http://localhost:5000/${child.birth_certificate_path}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No children registered</p>
            )}

            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedMom(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
