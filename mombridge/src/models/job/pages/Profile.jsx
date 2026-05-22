// src/jobprovider/Profile.jsx
import React, { useEffect, useState } from "react";
import {
  getJobProviderProfileApi,
  updateJobProviderProfileApi,
} from "../../../service/api";
import "./Profile.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const login_id = localStorage.getItem("login_id");
  console.log("LOGIN ID 👉", login_id);

  const [profile, setProfile] = useState({
    company_name: "",
    organization_type: "",
    email: "",
    phone: "",
    address: "",
    license_id: "",
    aadhar: "",
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!login_id) {
      console.error("No login_id found in localStorage");
      return;
    }
    fetchProfile();
  }, [login_id]);

  useEffect(() => {
    if (profile.organization_type === "Freelancer") {
      setProfile((prev) => ({ ...prev, license_id: "" }));
    } else {
      setProfile((prev) => ({ ...prev, aadhar: "" }));
    }
  }, [profile.organization_type]);

  // Fetch provider profile
  const fetchProfile = async () => {
    try {
      const response = await getJobProviderProfileApi(login_id); // should return current provider info
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  // Handle input change in edit mode
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  // Save updated profile
  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("Saving profile:", profile);

      await updateJobProviderProfileApi(login_id, profile);
      setMessage("Profile updated successfully");
      setEditMode(false);

      // re-fetch updated profile
      fetchProfile();
    } catch (error) {
      console.error("Update failed", error);
      setMessage("Failed to update profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-layout">
      <Header />

      <div className="job-body">
        <Sidebar />

        <main className="page-container">
          <div className="profile-container">
            <div className="profile-card">
              <h2>Welcome, {profile.company_name}</h2>
              {message && <div className="form-message">{message}</div>}

              <div className="profile-info">
                <label>Company Name:</label>
                {editMode ? (
                  <input
                    name="company_name"
                    value={profile.company_name}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile.company_name}</p>
                )}

                <label>Organization Type:</label>
                {editMode ? (
                  <select
                    name="organization_type"
                    value={profile.organization_type}
                    onChange={handleChange}
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>
                ) : (
                  <p>{profile.organization_type}</p>
                )}

                <label>Email:</label>
                <p>{profile.email}</p>

                <label>Phone:</label>
                {editMode ? (
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile.phone}</p>
                )}

                <label>Address:</label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{profile.address}</p>
                )}

                {/* ✅ Aadhar inside grid */}
                {profile.organization_type === "Freelancer" && (
                  <>
                    <label>Aadhar Number:</label>
                    {editMode ? (
                      <input
                        name="aadhar"
                        value={profile.aadhar || ""}
                        onChange={handleChange}
                      />
                    ) : (
                      <p>{profile.aadhar}</p>
                    )}
                  </>
                )}

                {/* ✅ License inside grid */}
                {(profile.organization_type === "Private" ||
                  profile.organization_type === "Government") && (
                  <>
                    <label>License ID:</label>
                    {editMode ? (
                      <input
                        name="license_id"
                        value={profile.license_id || ""}
                        onChange={handleChange}
                      />
                    ) : (
                      <p>{profile.license_id}</p>
                    )}
                  </>
                )}
              </div>

              <div className="profile-actions">
                {editMode ? (
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="jobs-redirect-card">
              <h3>Your Jobs</h3>
              <p>View and manage all jobs you have posted</p>

              <button
                className="btn-primary"
                onClick={() => navigate("/jobprovider/my-jobs")}
              >
                Go to My Jobs
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
