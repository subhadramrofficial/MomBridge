import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getSingleDonationApi, updateDonationApi } from "../../../service/api";
import CharitySidebar from "../components/CharitySidebar";
import CharityHeader from "../components/CharityHeader";
import "./EditCharity.css";

const EditDonation = () => {
  const { donationId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropCenter, setDropCenter] = useState("");

  useEffect(() => {
  const fetchDonation = async () => {
    try {
      const res = await getSingleDonationApi(donationId);
      const data = res.data;

      if (data.status === "collected") {
        alert("This donation cannot be edited");
        navigate("/charity/my-donations");
        return;
      }

      setItems(data.items || []);
      setDeliveryMode(data.delivery_mode);
      setPickupAddress(data.pickup_address || "");
      setDropCenter(data.drop_center || "");
    } catch (err) {
      console.error(err);
    }
  };

  fetchDonation();
}, [donationId]);

  // ✅ Add new empty item
  const handleAddItem = () => {
    setItems([...items, { item: "", quantity: 1 }]);
  };

  // ✅ Remove item
  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // ✅ Update item field
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };
  const handleUpdate = async () => {
    if (items.some((i) => !i.item || !i.quantity)) {
      alert("Please fill all item fields");
      return;
    }

    let updatedPickup = pickupAddress;
    let updatedDrop = dropCenter;

    if (deliveryMode === "pickup") {
      updatedDrop = "";
    } else {
      updatedPickup = "";
    }

    try {
      await updateDonationApi(donationId, {
        items,
        delivery_mode: deliveryMode,
        pickup_address: updatedPickup,
        drop_center: updatedDrop,
      });

      alert("Donation updated successfully");
      navigate("/charity/my-donations");
    } catch (err) {
      console.error(err);
      alert("Failed to update donation");
    }
  };
  const availableItems = [
    { value: "momDress", label: "Mom Dress" },
    { value: "babyDress", label: "Baby Dress" },
    { value: "diapers", label: "Diapers" },
    { value: "sanitaryPads", label: "Sanitary Pads" },
    { value: "groceries", label: "Groceries" },
    { value: "schoolSupplies", label: "School Supplies" },
    { value: "babyfood", label: "Baby Food" },
    { value: "others", label: "Others" },
  ];
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

        <div className="form-card">
          <h2 className="form-title">Edit Donation</h2>

          {/* Items */}
          <div className="form-section">
            <label className="section-label">Items</label>

            {items.map((item, index) => (
              <div key={index} className="item-row">
                <select
                  value={item.item}
                  onChange={(e) =>
                    handleItemChange(index, "item", e.target.value)
                  }
                >
                  <option value="">Select Item</option>
                  {availableItems
                    .filter(
                      (it) =>
                        !items.some(
                          (i, idx) => i.item === it.value && idx !== index,
                        ),
                    )
                    .map((it, i) => (
                      <option key={i} value={it.value}>
                        {it.label}
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) =>
                    handleItemChange(index, "quantity", Number(e.target.value))
                  }
                />

                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button className="add-btn" onClick={handleAddItem}>
              + Add Item
            </button>
          </div>

          {/* Delivery Mode */}
          <div className="form-section">
            <label className="section-label">Delivery Mode</label>

            <div className="radio-group">
              <label className="radio-card">
                <input
                  type="radio"
                  value="pickup"
                  checked={deliveryMode === "pickup"}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                />
                Pickup
              </label>

              <label className="radio-card">
                <input
                  type="radio"
                  value="drop"
                  checked={deliveryMode === "drop"}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                />
                Drop
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {deliveryMode === "pickup" && (
            <div className="form-section">
              <label className="section-label">Pickup Address</label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter pickup address..."
              />
            </div>
          )}

          {deliveryMode === "drop" && (
            <div className="form-section">
              <label className="section-label">Collection Center</label>
              <select
                value={dropCenter}
                onChange={(e) => setDropCenter(e.target.value)}
              >
                <option value="">Select Center</option>
                {collectionCenters.map((center) => (
                  <option key={center.id} value={center.name}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            className="submit-btn"
            onClick={handleUpdate}
            disabled={items.length === 0}
          >
            Update Donation
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDonation;
