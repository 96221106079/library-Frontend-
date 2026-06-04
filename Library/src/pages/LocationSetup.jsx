import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import styles from "./LocationSetup.module.css";

const LocationSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    country: "",
    address: "",
    lat: null,
    lng: null,
  });

  const [locationStatus, setLocationStatus] = useState("idle"); // idle, detecting, success, error

  const countries = [
    "India", "United States", "United Kingdom", "Canada", "Australia", 
    "Germany", "France", "Japan", "Brazil", "South Africa"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const detectLocation = () => {
    setLocationStatus("detecting");
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocationStatus("error");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setLocationStatus("success");
        setLoading(false);
      },
      (err) => {
        setError("Unable to retrieve your location. Please enter manually.");
        setLocationStatus("error");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.country || !formData.address) {
      setError("Please fill in country and address.");
      return;
    }

    setLoading(true);
    try {
      const res = await userAPI.updateLocation({
        country: formData.country,
        address: formData.address,
        lat: formData.lat || 0,
        lng: formData.lng || 0,
      });

      if (res.data.success) {
        // Update local storage user info
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        userInfo.country = formData.country;
        userInfo.address = formData.address;
        userInfo.location = res.data.user.location;
        localStorage.setItem("user", JSON.stringify(userInfo));

        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob}></div>
      <div className={styles.blob2}></div>
      
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>📍</span>
          </div>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>
            Help us finding the best book exchanges for you by setting your location.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Select Country</label>
            <select 
              name="country" 
              value={formData.country} 
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>Choose your country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Address</label>
            <textarea 
              name="address" 
              placeholder="Enter your full address or community name"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows="3"
            />
          </div>

          <div className={styles.divider}>
            <span>Optional GPS Sync</span>
          </div>

          <button 
            type="button" 
            className={`${styles.locationBtn} ${styles[locationStatus]}`}
            onClick={detectLocation}
            disabled={loading}
          >
            {locationStatus === "detecting" ? (
              <span className={styles.spinner}></span>
            ) : locationStatus === "success" ? (
              "✅ Location Captured"
            ) : (
              "🎯 Use My Current Location"
            )}
          </button>

          {error && <p className={styles.error}>{error}</p>}

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Confirm & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationSetup;
