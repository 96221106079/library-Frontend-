import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { libraryAPI } from "../services/api";
import styles from "./NearbyLibraries.module.css";
import { useNavigate } from "react-router-dom";

// Leaflet Marker Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 14); }, [lat, lng, map]);
  return null;
};

// Routing Control Component
const RoutingMachine = ({ userLoc, libLoc, onRouteInfo }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc || !libLoc) return;
    if (!window.L || !window.L.Routing) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    try {
      routingControlRef.current = window.L.Routing.control({
        waypoints: [
          window.L.latLng(userLoc.lat, userLoc.lng),
          window.L.latLng(libLoc.lat, libLoc.lng)
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
  }, [map, userLoc, libLoc, onRouteInfo]);

  return null;
};

const NearbyLibraries = () => {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [userLoc, setUserLoc] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.location?.lat) {
      navigate("/location-setup");
      return;
    }
    setUserLoc({ lat: user.location.lat, lng: user.location.lng });

    const fetchLibraries = async () => {
      try {
        const res = await libraryAPI.getNearby(user.location.lat, user.location.lng, 50);
        if (res.data.success) setLibraries(res.data.libraries);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLibraries();
  }, [navigate]);

  const handleSelectLibrary = (lib) => {
    setSelectedLibrary(lib);
    setRouteInfo(null);
    if (viewMode === 'list') setViewMode('map');
  };

  if (!userLoc) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
            <h2 className={styles.title}>🏛️ Library Hub</h2>
            <div className={styles.toggleGroup}>
                <button className={viewMode === 'list' ? styles.activeToggle : ""} onClick={() => setViewMode('list')}>List</button>
                <button className={viewMode === 'map' ? styles.activeToggle : ""} onClick={() => setViewMode('map')}>Map</button>
            </div>
        </div>
        <p className={styles.subtitle}>Discover <strong>institutional</strong> collections near you</p>
      </header>

      {viewMode === "list" ? (
        <div className={styles.listContainer}>
          {libraries.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📍</span>
              <h3>No Libraries Nearby</h3>
              <p>Try increasing your search radius or setting a new location.</p>
            </div>
          ) : (
            libraries.map(lib => (
              <div key={lib._id} className={styles.libListItem}>
                <div className={styles.libInfo}>
                  <h4>{lib.name}</h4>
                  <p className={styles.libDist}>📍 {lib.distanceLabel || "Near you"} away</p>
                  <p className={styles.libAddr}>{lib.address}</p>
                </div>
                <button 
                  className={styles.viewBooksBtn}
                  onClick={() => handleSelectLibrary(lib)}
                >
                  View on Map ➔
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.mapContainer}>
          <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={14} className={styles.map}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RecenterMap lat={userLoc.lat} lng={userLoc.lng} />
            <Marker position={[userLoc.lat, userLoc.lng]}><Popup>You</Popup></Marker>
            {libraries.map(lib => (
              <Marker 
                key={lib._id} 
                position={[lib.location.lat, lib.location.lng]}
                eventHandlers={{ click: () => { handleFetchBooks(lib); setRouteInfo(null); } }}
              >
                <Popup>
                  <strong>{lib.name}</strong><br/>
                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b' }}>{lib.address}</p>
                </Popup>
              </Marker>
            ))}

            {selectedLibrary && userLoc && (
              <RoutingMachine 
                userLoc={userLoc} 
                libLoc={{ lat: selectedLibrary.location.lat, lng: selectedLibrary.location.lng }} 
                onRouteInfo={setRouteInfo} 
              />
            )}
          </MapContainer>

          {/* Route Info Overlay */}
          {selectedLibrary && routeInfo && (
            <div style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)", 
              padding: "16px", borderRadius: "20px", zIndex: 1000,
              border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)", minWidth: "160px"
            }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Travel Route</div>
              <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>{selectedLibrary.name}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Distance</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#6366f1" }}>{routeInfo.distance} km</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>Time</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>{routeInfo.time} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {loading && <div className={styles.overlayLoader}>Syncing Libraries...</div>}
    </div>
  );
};

export default NearbyLibraries;
