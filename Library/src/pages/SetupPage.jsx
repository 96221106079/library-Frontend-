import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Compass, Search, ArrowRight, ShieldCheck } from "lucide-react";
import { userAPI } from "../services/api";

const SetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completeSetup = (setupDone = true) => {
    localStorage.setItem("setupDone", "true");
    navigate("/home");
  };

  const handleUseLocation = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Store in localStorage for immediate use
          localStorage.setItem("userLocation", JSON.stringify({ lat: latitude, lng: longitude }));
          
          // Optionally update on backend
          await userAPI.updateLocation({
            lat: latitude,
            lng: longitude,
            country: "Detected", // Placeholder
            address: "Current Location" // Placeholder
          });

          completeSetup();
        } catch (err) {
          console.error("Failed to save location to backend", err);
          // Still proceed since we have it in localStorage
          completeSetup();
        }
      },
      (err) => {
        setError("Location access denied. Please try another option.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleExplore = () => {
    completeSetup();
  };

  const handleManualSearch = () => {
    localStorage.setItem("searchMode", "true");
    completeSetup();
  };

  const options = [
    {
      id: "location",
      title: "Use My Location",
      desc: "Find books and libraries in your immediate vicinity.",
      icon: <MapPin className="w-6 h-6 text-indigo-500" />,
      action: handleUseLocation,
      color: "from-indigo-500/20 to-blue-500/20",
      border: "border-indigo-500/30"
    },
    {
      id: "explore",
      title: "Explore All Books",
      desc: "Browse our entire global collection without location limits.",
      icon: <Compass className="w-6 h-6 text-emerald-500" />,
      action: handleExplore,
      color: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/30"
    },
    {
      id: "search",
      title: "Search Manually",
      desc: "Enter a specific area or library to find what you need.",
      icon: <Search className="w-6 h-6 text-amber-500" />,
      action: handleManualSearch,
      color: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/30"
    }
  ];

  return (
    <div className="setup-container">
      <div className="setup-blur-bg"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="setup-card"
      >
        <div className="setup-header">
          <div className="setup-badge">
            <ShieldCheck className="w-4 h-4" />
            <span>Step 1: Onboarding</span>
          </div>
          <h1>Welcome to Smart Library</h1>
          <p>How would you like to discover books today?</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="setup-error"
          >
            {error}
          </motion.div>
        )}

        <div className="setup-options">
          {options.map((option, idx) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={option.action}
              disabled={loading}
              className={`setup-option-card ${option.border}`}
            >
              <div className={`option-icon-bg bg-gradient-to-br ${option.color}`}>
                {option.icon}
              </div>
              <div className="option-content">
                <h3>{option.title}</h3>
                <p>{option.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
              
              {loading && option.id === "location" && (
                <div className="option-loading">
                  <div className="spinner-small"></div>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="setup-footer">
          <p>You can change these preferences later in your profile settings.</p>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .setup-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          padding: 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .setup-blur-bg {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
        }

        .setup-card {
          width: 100%;
          max-width: 540px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 48px;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .setup-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .setup-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .setup-header h1 {
          color: white;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .setup-header p {
          color: #94a3b8;
          font-size: 16px;
        }

        .setup-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .setup-option-card {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          position: relative;
        }

        .setup-option-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .option-icon-bg {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
        }

        .option-content h3 {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .option-content p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.4;
        }

        .setup-footer {
          margin-top: 32px;
          text-align: center;
          color: #475569;
          font-size: 13px;
        }

        .setup-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          text-align: center;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
      `}} />
    </div>
  );
};

export default SetupPage;
