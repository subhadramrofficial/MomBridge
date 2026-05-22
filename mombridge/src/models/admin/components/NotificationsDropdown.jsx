import { useEffect, useState } from "react";
import { getNotificationsApi, markNotificationReadApi } from "../../../service/api";

export default function NotificationsDropdown({ userId }) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi(userId);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(notifications.map(n => n._id === id ? {...n, read: true} : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: "relative" }}>
      {/* <button>
        Notifications {unreadCount > 0 && `(${unreadCount})`}
      </button> */}
      <div style={{
        position: "absolute", right: 0, top: "100%",
        background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: 300, maxHeight: 400, overflowY: "auto", borderRadius: 8
      }}>
        {/* {notifications.length === 0 && <p style={{ padding: 12 }}>No notifications</p>} */}
        {notifications.map(n => (
          <div key={n._id} style={{
            padding: "8px 12px",
            borderBottom: "1px solid #eee",
            backgroundColor: n.read ? "#f9fafb" : "#e0f2fe",
            cursor: "pointer"
          }}
          onClick={() => handleMarkRead(n._id)}
          >
            <strong>{n.type.replace("_", " ").toUpperCase()}</strong>
            <p style={{ margin: 0 }}>{n.message}</p>
            <small>{new Date(n.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}