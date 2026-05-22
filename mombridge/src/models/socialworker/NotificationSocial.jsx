// NotificationSocial.jsx
import { useEffect, useState } from "react";
import {
  getNotificationsApi,
  markNotificationReadApi,
} from "../../service/api";

export default function NotificationSocial({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false); // dropdown open/close

  useEffect(() => {
    fetchNotifications();
    // optionally, poll for new notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsApi(userId);

      const filtered = data.filter((n) => {
        const handled = n.handled_by || [];
        const handledStrings = handled.map((id) => id.toString());
        return !handledStrings.includes(userId); // 👈 KEY LINE
      });

      setNotifications(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id, userId); // must pass userId
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div style={{ position: "relative", marginTop: "20px" }}>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          fontSize: "20px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "#fff",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: 0,
            width: "300px",
            maxHeight: "200px",
            overflowY: "auto",
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "6px",
            zIndex: 10,
          }}
        >
          {notifications.length === 0 && (
            <p style={{ padding: "10px", margin: 0 }}>No notifications</p>
          )}
          {notifications.map((n) => (
            <div
              key={n._id}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                backgroundColor: "#f0f4f8",
              }}
              onClick={() => handleMarkRead(n._id)}
            >
              <strong>{n.type.replace("_", " ").toUpperCase()}</strong>
              <p style={{ margin: 0, fontSize: "12px" }}>{n.message}</p>
              <small>
                {new Date(n.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata", // 👈 important
                })}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
