import React, { useEffect, useState } from "react";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import { getCharityProfileApi, updateCharityProfileApi } from "../../../service/api";
import "./CharityHome.css";

const CharityProfile = () => {
  const login_id = localStorage.getItem("login_id");

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    organization_name: "",
    email: "",
    phone: "",
    address: "",
    aadhar: "",
  });

  /* -------------------------
     Fetch profile
  ------------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getCharityProfileApi(login_id);
        setFormData(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load charity profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [login_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* -------------------------
     Save profile
  ------------------------- */
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await updateCharityProfileApi(login_id, {
        organization_name: formData.organization_name,
        phone: formData.phone,
        address: formData.address,
      });

      alert("Profile updated successfully");
      setIsEdit(false);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: 30 }}>Loading profile...</p>;
  }

  return (
    <div className="charity-layout">
      <CharitySidebar />

      <div className="charity-main">
        <CharityHeader />

        <div className="profile-card">
          <div className="profile-header">
            <h3>My Profile</h3>
          </div>

          <div className="profile-grid">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                disabled={!isEdit}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={formData.email} disabled />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEdit}
              />
            </div>

            <div className="form-group full">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEdit}
              />
            </div>

            <div className="form-group">
              <label>Aadhaar</label>
              <input
                value={`XXXX XXXX ${formData.aadhar?.slice(-4)}`}
                disabled
              />
            </div>
          </div>

          {/* -------------------------
               Profile Action Buttons
          ------------------------- */}
          <div className="profile-actions" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {!isEdit && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => setIsEdit(true)}
                >
                  Edit Profile
                </button>

                <button
                  className="btn-primary"
                  onClick={() => window.location.href = "/charity/change-password"}
                >
                  Change Password
                </button>
              </>
            )}

            {isEdit && (
              <>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setIsEdit(false)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharityProfile;