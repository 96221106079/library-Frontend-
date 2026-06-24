import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { booksAPI } from "../services/api";

const categories = ["Education", "Technology", "Fiction", "Non-Fiction", "Biography", "Science", "History", "Business", "Health"];

const AddBook = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    availabilityType: "both",
    buyPrice: "",
    rentPrice: "",
    rentDuration: "7",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const getStoredLocation = () => {
    try {
      const localLocation = JSON.parse(localStorage.getItem("userLocation") || "null");
      if (
        localLocation &&
        Number.isFinite(Number(localLocation.lat)) &&
        Number.isFinite(Number(localLocation.lng))
      ) {
        return {
          lat: Number(localLocation.lat),
          lng: Number(localLocation.lng),
        };
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userLat = user.location?.coordinates?.[1] ?? user.location?.lat;
      const userLng = user.location?.coordinates?.[0] ?? user.location?.lng;

      if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
        return {
          lat: Number(userLat),
          lng: Number(userLng),
        };
      }
    } catch (error) {
      console.error("Failed to read saved location", error);
    }

    return null;
  };

  const hasSavedLocation = Boolean(getStoredLocation());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, author, category } = formData;

    if (!title.trim() || !author.trim() || !category) {
      setMessage({ text: "Please fill all required fields.", type: "error" });
      return;
    }

    const savedLocation = getStoredLocation();
    if (!savedLocation) {
      setMessage({
        text: "Please set your location before listing a book.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: title.trim(),
        author: author.trim(),
        category,
        availabilityType: formData.availabilityType,
        buyPrice: formData.buyPrice !== "" ? Number(formData.buyPrice) : null,
        rentPrice: formData.rentPrice !== "" ? Number(formData.rentPrice) : null,
        rentDuration: formData.rentDuration !== "" ? Number(formData.rentDuration) : 7,
        location: savedLocation,
        image:
          imagePreview ||
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400",
      };

      console.log("=== SUBMITTING BOOK ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));
      const response = await booksAPI.create(payload);

      console.log("=== API RESPONSE ===");
      console.log("Response:", JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        setMessage({ text: "Book added successfully! Redirecting...", type: "success" });
        setTimeout(() => navigate("/home"), 1500);
      }
    } catch (error) {
      console.error("=== BOOK SUBMISSION ERROR ===");
      console.error("Error:", error);
      console.error("Response data:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Failed to add book.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="add-book-page"
      style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
    >
      <div className="section-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>
          Sell Your Book
        </h2>
        <p style={{ color: "#64748b" }}>
          Capture your book&apos;s cover and list it for the community.
        </p>
      </div>

      <div
        className="auth-card"
        style={{
          padding: "30px",
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
        }}
      >
        {!hasSavedLocation && (
          <div
            style={{
              padding: "14px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: "#fff7ed",
              color: "#9a3412",
              border: "1px solid #fdba74",
            }}
          >
            Your location is required to list a book.
            <button
              type="button"
              onClick={() => navigate("/location-setup")}
              style={{
                marginLeft: "10px",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "none",
                background: "#ea580c",
                color: "#0f172a",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Set Location
            </button>
          </div>
        )}

        {message.text && (
          <div
            className={`auth-message ${message.type}`}
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            {message.type === "success" ? "Success:" : "Error:"} {message.text}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div className="image-upload-section" style={{ textAlign: "center" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#64748b",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}
            >
              Book Cover Photo
            </label>

            <div
              onClick={triggerFileInput}
              style={{
                width: "100%",
                height: "240px",
                border: "2px dashed #e2e8f0",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                background: "#f8fafc",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#7c3aed";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <>
                  <div style={{ fontSize: "3rem", marginBottom: "10px" }}>Upload</div>
                  <p style={{ fontWeight: 600, color: "#475569", margin: 0 }}>
                    Take a Photo or Upload
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>JPEG, PNG allowed</p>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
            />
          </div>

          <div className="form-group">
            <label
              style={{
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Book Title
            </label>
            <input
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                marginTop: "6px",
              }}
              type="text"
              name="title"
              placeholder="Enter book title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
          >
            <div className="form-group">
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Author
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e2e8f0",
                  marginTop: "6px",
                }}
                type="text"
                name="author"
                placeholder="Author name"
                value={formData.author}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Category
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e2e8f0",
                  marginTop: "6px",
                  background: "#fff",
                }}
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="form-row"
            style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "15px" }}
          >
            <div className="form-group">
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Listed For
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e2e8f0",
                  marginTop: "6px",
                  background: "#fff",
                  cursor: "pointer",
                }}
                name="availabilityType"
                value={formData.availabilityType}
                onChange={handleChange}
              >
                <option value="both">🔀 Both (Rent &amp; Buy)</option>
                <option value="rent">🎯 Rent Only</option>
                <option value="buy">🛍️ Buy Only</option>
              </select>
            </div>

            {(formData.availabilityType === "both" || formData.availabilityType === "buy") && (
              <div className="form-group">
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Buy Price (INR)
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    marginTop: "6px",
                  }}
                  type="number"
                  name="buyPrice"
                  placeholder="Full Price"
                  value={formData.buyPrice}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            )}
          </div>

          {(formData.availabilityType === "both" || formData.availabilityType === "rent") && (
            <div
              className="form-row"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
            >
              <div className="form-group">
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Rent Price (INR)
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    marginTop: "6px",
                  }}
                  type="number"
                  name="rentPrice"
                  placeholder="eg: ₹50"
                  value={formData.rentPrice}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  Rent Duration (Days)
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    marginTop: "6px",
                  }}
                  type="number"
                  name="rentDuration"
                  placeholder="7"
                  value={formData.rentDuration}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={() => navigate("/home")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "#f1f5f9",
                color: "#475569",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-btn"
              disabled={loading || !hasSavedLocation}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
                color: "#0f172a",
                fontWeight: 700,
                cursor: loading || !hasSavedLocation ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
                opacity: loading || !hasSavedLocation ? 0.7 : 1,
              }}
            >
              {loading ? "Processing..." : "List Book Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
