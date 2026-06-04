// ============================================
// OtpLocationModal.jsx - P2P Handover Interface
// ============================================

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { booksAPI } from "../services/api";

// Fix for default marker icons in Leaflet + React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Routing Control Component
const RoutingMachine = ({ userLoc, targetLoc, onRouteInfo }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc || !targetLoc) return;
    if (!window.L || !window.L.Routing) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    try {
      routingControlRef.current = window.L.Routing.control({
        waypoints: [
          window.L.latLng(userLoc.lat, userLoc.lng),
          window.L.latLng(targetLoc.lat, targetLoc.lng)
        ],
        lineOptions: {
          styles: [{ color: '#6366f1', weight: 6, opacity: 0.8 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false
      }).addTo(map);

      routingControlRef.current.on('routesfound', (e) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        onRouteInfo({
          distance: (summary.totalDistance / 1000).toFixed(1),
          time: Math.round(summary.totalTime / 60)
        });
      });
    } catch (err) {
      console.error("Routing Error:", err);
    }

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, userLoc, targetLoc, onRouteInfo]);

  return null;
};

const OtpLocationModal = ({ isOpen, onClose, book, type, onRefresh }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userLoc, setUserLoc] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error("Geolocation Error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setMessage({ text: "Please enter a valid 6-digit OTP.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await booksAPI.verifyP2P(book?._id, otp);
      if (response.data.success) {
        setMessage({ text: response.data.message, type: "success" });
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || "Verification failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Static location from database
  const contactLocation = book.owner?.location;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="auth-card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Confirm {type.toUpperCase()}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Meet <strong>{book.owner?.username}</strong> at their registered location and ask for the security code.
          </p>

          {contactLocation?.lat && (
            <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)', marginBottom: '1.5rem', position: 'relative' }}>
              <MapContainer center={[contactLocation.lat, contactLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {userLoc && (
                  <Marker position={[userLoc.lat, userLoc.lng]}>
                    <Popup>You are here</Popup>
                  </Marker>
                )}

                <Marker position={[contactLocation.lat, contactLocation.lng]}>
                  <Popup>Meeting Point (Owner)</Popup>
                </Marker>

                {userLoc && contactLocation && (
                  <RoutingMachine 
                    userLoc={userLoc} 
                    targetLoc={contactLocation} 
                    onRouteInfo={setRouteInfo} 
                  />
                )}
              </MapContainer>

              {routeInfo && (
                 <div style={{
                   position: 'absolute', bottom: '12px', right: '12px',
                   background: 'rgba(255,255,255,0.95)', padding: '8px 12px',
                   borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                   zIndex: 1000, fontSize: '12px', border: '1px solid #e2e8f0'
                 }}>
                   <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Travel Stats</div>
                   <div style={{ display: 'flex', gap: '10px' }}>
                     <span>📏 <strong>{routeInfo.distance} km</strong></span>
                     <span>🕒 <strong>{routeInfo.time} min</strong></span>
                   </div>
                 </div>
              )}
            </div>
          )}
          
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
             <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Meeting Point:</strong> {book.owner?.address}</p>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Security OTP Code</label>
          <input 
            type="text" 
            placeholder="Enter 6-digit code" 
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', padding: '1rem' }}
          />
        </div>

        {message.text && (
          <div className={`auth-message ${message.type}`} style={{ marginBottom: '1rem' }}>
            {message.text}
          </div>
        )}

        <button 
          className="auth-btn" 
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          style={{ width: '100%' }}
        >
          {loading ? "Verifying..." : `Confirm ${type.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
};

export default OtpLocationModal;
