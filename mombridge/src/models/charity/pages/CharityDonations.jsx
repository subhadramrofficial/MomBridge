import React, { useState } from "react";
import axios from "axios";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import "./CharityDonations.css";

const CharityDonations = () => {
  const login_id = localStorage.getItem("login_id");

  const [items, setItems] = useState({
    momDress: "",
    babyDress: "",
    diapers: "",
    sanitaryPads: "",
    groceries: "",
    schoolSupplies: "",
    babyfood: "",
    others: "",
  });

  const [deliveryMode, setDeliveryMode] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropCenter, setDropCenter] = useState("");

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    if (name !== "others") {
      setItems({
        ...items,
        [name]: Math.max(1, Number(value)),
      });
    } else {
      setItems({
        ...items,
        [name]: value,
      });
    }
  };
  const handleSubmit = async () => {
    const donationItems = [];

    Object.entries(items).forEach(([key, value]) => {
      if (value && Number(value) > 0) {
        donationItems.push({
          item: key,
          quantity: Number(value),
        });
      }
    });

    if (deliveryMode === "pickup" && !pickupAddress.trim()) {
      alert("Please enter pickup address");
      return;
    }

    if (deliveryMode === "drop" && !dropCenter) {
      alert("Please select a collection center");
      return;
    }

    if (donationItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    if (!deliveryMode) {
      alert("Please choose pickup or drop option");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/charity/donate", {
        login_id,
        items: donationItems,
        delivery_mode: deliveryMode,
        pickup_address: pickupAddress,
        drop_center: dropCenter,
      });

      alert("Donation submitted successfully");

      // reset
      setItems({
        momDress: "",
        babyDress: "",
        diapers: "",
        sanitaryPads: "",
        groceries: "",
        schoolSupplies: "",
        babyfood: "",
        others: "",
      });
      setDeliveryMode("");
      setPickupAddress("");
      setDropCenter("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit donation");
    }
  };

  const collectionCenters = [
    { id: 1, name: "Ernakulam H.O – 682011" },
    { id: 2, name: "Vyttila Post Office – 682019" },
    { id: 3, name: "Edapally Post Office – 682024" },
    { id: 4, name: "Palarivattom Post Office – 682025" },
    { id: 5, name: "Kakkanad Post Office – 682030" },
    { id: 6, name: "Thrikkakara Post Office – 682021" },
  ];

  return (
    <div className="charity-layout">
      <CharitySidebar />

      <div className="charity-main">
        <CharityHeader />

        <div className="donation-form-card">
          <h3>Make a Donation</h3>

          {/* ITEMS */}
          <div className="form-grid">
            <label>
              Mom Dresses
              <input
                type="number"
                placeholder="0"
                name="momDress"
                min="1"
                value={items.momDress}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Baby Dresses
              <input
                type="number"
                placeholder="0"
                name="babyDress"
                min="1"
                value={items.babyDress}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Diapers
              <input
                type="number"
                placeholder="0"
                name="diapers"
                min="1"
                value={items.diapers}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Sanitary Pads
              <input
                type="number"
                placeholder="0"
                name="sanitaryPads"
                min="1"
                value={items.sanitaryPads}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Groceries
              <input
                type="number"
                placeholder="0"
                name="groceries"
                min="1"
                value={items.groceries}
                onChange={handleItemChange}
              />
            </label>

            <label>
              School Supplies
              <input
                type="number"
                placeholder="0"
                name="schoolSupplies"
                min="1"
                value={items.schoolSupplies}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Baby Food
              <input
                type="number"
                placeholder="0"
                name="babyfood"
                min="1"
                value={items.babyfood}
                onChange={handleItemChange}
              />
            </label>

            <label>
              Others
              <input
                type="text"
                name="others"
                value={items.others}
                onChange={handleItemChange}
                placeholder="Describe items"
              />
            </label>
          </div>

          <div className="delivery-card">
  <h4 className="section-title">Delivery Method</h4>

  <div className="delivery-options">
    <label
      className={`delivery-option ${
        deliveryMode === "pickup" ? "active" : ""
      }`}
    >
      <input
        type="radio"
        name="delivery"
        value="pickup"
        checked={deliveryMode === "pickup"}
        onChange={(e) => setDeliveryMode(e.target.value)}
      />
      <span>Pickup by Social Worker</span>
    </label>

    <label
      className={`delivery-option ${
        deliveryMode === "drop" ? "active" : ""
      }`}
    >
      <input
        type="radio"
        name="delivery"
        value="drop"
        checked={deliveryMode === "drop"}
        onChange={(e) => setDeliveryMode(e.target.value)}
      />
      <span>Drop at Collection Center</span>
    </label>
  </div>

  {/* Conditional Fields */}
  {deliveryMode === "pickup" && (
    <textarea
      className="delivery-input"
      placeholder="Enter pickup address..."
      value={pickupAddress}
      onChange={(e) => setPickupAddress(e.target.value)}
    />
  )}

  {deliveryMode === "drop" && (
    <select
      className="delivery-input"
      value={dropCenter}
      onChange={(e) => setDropCenter(e.target.value)}
    >
      <option value="">Select Collection Center</option>
      {collectionCenters.map((center) => (
        <option key={center.id} value={center.name}>
          {center.name}
        </option>
      ))}
    </select>
  )}
</div>

          <button className="primary-btn" onClick={handleSubmit}>
            Submit Donation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharityDonations;
