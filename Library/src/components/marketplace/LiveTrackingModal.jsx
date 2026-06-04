import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { socket, connectSocket } from "../../services/socket";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet + React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Borrower and Owner
const createCustomIcon = (color, emoji) => L.divIcon({
  html: `<div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; border: 3px solid #fff; display: flex; alignItems: center; justifyContent: center; fontSize: 20px; boxShadow: 0 4px 10px rgba(0,0,0,0.3)">${emoji}</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const ownerIcon = createCustomIcon("#6366f1", "🏠");
const borrowerIcon = createCustomIcon("#10b981", "🚶");

// Routing Control Component
const RoutingMachine = ({ userLoc, otherLoc, onRouteInfo }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc || !otherLoc) return;
    if (!window.L || !window.L.Routing) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    try {
      routingControlRef.current = window.L.Routing.control({
        waypoints: [
          window.L.latLng(userLoc.lat, userLoc.lng),
          window.L.latLng(otherLoc.lat, otherLoc.lng)
        ],
        lineOptions: {
          styles: [{ color: '#6366f1', weight: 6, opacity: 0.8 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false, // Don't snap zoom every update to avoid jitter
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
  }, [map, userLoc, otherLoc, onRouteInfo]);

  return null;
};

// Helper to auto-center map when points change
const MapUpdater = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
};

const LiveTrackingModal = ({ requestId, role, book, initialLocations, onClose }) => {
  const [myLocation, setMyLocation] = useState(null);
  const [otherLocation, setOtherLocation] = useState(initialLocations?.[role === "owner" ? "borrowerLocation" : "ownerLocation"] || null);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);

  const isOwner = role === "owner";
  const otherRole = isOwner ? "borrower" : "owner";

  useEffect(() => {
    connectSocket();
    socket.emit("join-tracking", requestId);

    // Listen for the other party
    const handleLocationUpdate = (data) => {
      console.log("📍 Location Received:", data);
      if (data.role === otherRole) {
        setOtherLocation({ lat: data.lat, lng: data.lng });
      }
    };

    socket.on("location-updated", handleLocationUpdate);

    // Periodic Location Push (Every 5 seconds as requested)
    const pushLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const loc = { lat: latitude, lng: longitude };
            setMyLocation(loc);
            socket.emit("update-location", { requestId, role, ...loc });
          },
          (err) => console.error("Periodic Geoloc Error:", err),
          { enableHighAccuracy: true }
        );
      }
    };

    const intervalId = setInterval(pushLocation, 5000);
    pushLocation(); // Initial push

    // Watch position for smoother movement
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const loc = { lat: latitude, lng: longitude };
          setMyLocation(loc);
          socket.emit("update-location", { requestId, role, ...loc });
        },
        (err) => {
          setError("Location access denied. Please enable GPS.");
          console.error(err);
        },
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    } else {
      setError("Geolocation not supported by browser.");
    }

    return () => {
      socket.off("location-updated", handleLocationUpdate);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [requestId, role, otherRole]);

  const points = [myLocation, otherLocation].filter(p => p !== null);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.9)",
      backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", 
      alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: "900px", height: "80vh", background: "#1e293b",
        borderRadius: "32px", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)"
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: 800 }}>Live Handover Tracking</h3>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "13px" }}>Tracking {isOwner ? "Borrower" : "Owner"} for "{book?.title}"</p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "none", color: "#fff",
            padding: "8px 16px", borderRadius: "12px", fontWeight: 700, cursor: "pointer"
          }}>Close</button>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer 
            center={myLocation || [20, 77]} 
            zoom={13} 
            style={{ width: "100%", height: "100%" }}
          >
            {/* Using a clean dark-themed tile layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {myLocation && (
              <Marker position={myLocation} icon={isOwner ? ownerIcon : borrowerIcon}>
                <Popup><b>You</b> (Your current location)</Popup>
              </Marker>
            )}

            {otherLocation && (
              <Marker position={otherLocation} icon={isOwner ? borrowerIcon : ownerIcon}>
                <Popup><b>{isOwner ? "Borrower" : "Owner"}</b> (Live Tracking)</Popup>
              </Marker>
            )}

            {myLocation && otherLocation && (
              <RoutingMachine 
                userLoc={myLocation} 
                otherLoc={otherLocation} 
                onRouteInfo={setRouteInfo} 
              />
            )}

            <MapUpdater points={points} />
          </MapContainer>

          {/* Route Stats Legend */}
          {routeInfo && (
            <div style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)", 
              padding: "16px", borderRadius: "20px", zIndex: 1000,
              border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)", minWidth: "140px"
            }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Live Route</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>Distance</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#6366f1" }}>{routeInfo.distance} km</div>
                </div>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>Travel Time</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981" }}>{routeInfo.time} mins</div>
                </div>
              </div>
            </div>
          )}

          {/* Error / Status Overlay */}
          {error && (
            <div style={{
              position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)",
              background: "#ef4444", color: "#fff", padding: "10px 20px", borderRadius: "12px",
              zIndex: 1000, fontWeight: 700, fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}>
              ⚠️ {error}
            </div>
          )}

          {!otherLocation && !error && (
            <div style={{
              position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(12px)", color: "#fff", 
              padding: "16px 32px", borderRadius: "100px", zIndex: 1000, fontSize: "14px",
              border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)", whiteSpace: "nowrap"
            }}>
              <div className="pulse-dot"></div>
              <span>Waiting for <strong>{isOwner ? "borrower" : "owner"}</strong> to join tracking...</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: "16px 24px", display: "flex", gap: "24px", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "14px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#6366f1" }}></div>
            <span>Owner</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "14px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></div>
            <span>Borrower</span>
          </div>
        </div>

        <style>{`
          .pulse-dot {
            width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          .leaflet-container { background: #111 !important; }
        `}</style>
      </div>
    </div>
  );
};

export default LiveTrackingModal;
