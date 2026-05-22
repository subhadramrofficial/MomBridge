import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import "../components/Admin.css";

export default function AdminDashboard() {
  return (
    <div className="admin-container">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <div className="admin-content">
          <Outlet /> {/* Child routes will render here */}
        </div>
      </div>
    </div>
  );
}
  