import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Admin.css";

export default function AdminSidebar() {
  const [notificationCounts, setNotificationCounts] = useState({
    charity_registration: 0,
    jobprovider_registration: 0,
    mom_request: 0,
    sponsorship_request: 0,
    job_post_request: 0,
  });

  // Fetch counts from backend
  // ✅ reusable function
  const fetchNotificationCounts = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/admin/notifications-count/admin_id_here",
      );
      const data = await res.json();
      setNotificationCounts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ useEffect
  useEffect(() => {
    fetchNotificationCounts();

    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notifications as read
  const markAsRead = async (type) => {
    try {
      await fetch(
        `http://localhost:5000/admin/notifications/mark-read-by-type/${type}`,
        { method: "PUT" },
      );

      fetchNotificationCounts(); // 🔥 refresh after click
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="admin-sidebar">
      <h2 className="logo">Admin Panel</h2>

      <ul>
        <li>
          <Link to="/admin/dashboard">Dashboard</Link>
        </li>

        <li className="section">Verification</li>
        <li>
          <Link
            to="/admin/verify/charities"
            onClick={() => markAsRead("charity_registration")}
          >
            Charity Providers
            {notificationCounts.charity_registration > 0 && (
              <span className="badge">
                {notificationCounts.charity_registration}
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link
            to="/admin/verify/job-providers"
            onClick={() => markAsRead("jobprovider_registration")}
          >
            Job Providers
            {notificationCounts.jobprovider_registration > 0 && (
              <span className="badge">
                {notificationCounts.jobprovider_registration}
              </span>
            )}
          </Link>
        </li>

        <li className="section">Mothers</li>
        <li>
          <Link to="/admin/verified-moms">Verified Moms</Link>
        </li>
        <li>
          <Link
            to="/admin/mom-requests"
            onClick={() => markAsRead("mom_request")}
          >
            Charity Requests
            {notificationCounts.mom_request > 0 && (
              <span className="badge">{notificationCounts.mom_request}</span>
            )}
          </Link>
        </li>
        <li>
          <Link
            to="/admin/sponsorship-requests"
            onClick={() => markAsRead("sponsorship_requests")}
          >
            Sponsorship Requests
            {notificationCounts.sponsorship_requests > 0 && (
              <span className="badge">
                {notificationCounts.sponsorship_requests}
              </span>
            )}
          </Link>
        </li>

        <li className="section">Management</li>
        <li>
          <Link to="/admin/view/charities">Charities</Link>
        </li>
        <li>
          <Link to="/admin/create-social-worker">Create Social Workers</Link>
        </li>
        <li>
          <Link
            to="/admin/job-approvals"
            onClick={() => markAsRead("job_post_request")}
          >
            Job Approvals
            {notificationCounts.job_post_request > 0 && (
              <span className="badge">
                {notificationCounts.job_post_request}
              </span>
            )}
          </Link>
        </li>

       
      </ul>
    </div>
  );
}
