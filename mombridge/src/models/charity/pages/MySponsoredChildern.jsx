import React, { useEffect, useState } from "react";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import { getSponsoredChildrenApi } from "../../../service/api";
import "./CharityHome.css"; // reuse existing styles
export default function ViewSponsoredChildren() {
  const [children, setChildren] = useState([]);

  const loadData = async () => {
    try {
      const res = await getSponsoredChildrenApi();
      const data = res.data || [];
      setChildren(data);
    } catch (err) {
      console.log("Error fetching sponsored children:", err);
      setChildren([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <div className="charity-layout">
      <CharitySidebar />

      <div className="charity-main">
        <CharityHeader />

        <h2 className="page-title">Sponsored Children</h2>

        <div className="charity-content">
          {children.map((child) => (
            <div key={child._id} className="sponsored-card">
              <h3>{child.child_name}</h3>

              <p>
                <b>Purpose:</b> {child.purpose}
              </p>

              <p>
                <b>Amount:</b> ₹{child.amount}
              </p>

              <p>
                <b>Status:</b>
                <span className={`status-badge ${child.status}`}>
                  {child.status}
                </span>
              </p>

              <p>
                <b>Sponsored At:</b> {child.sponsored_at || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
