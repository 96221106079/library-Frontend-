import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./NearbyLibraries.module.css";

// Leaflet Marker Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RecenterMap = ({ lat, lng, libraries }) => {
  const map = useMap();
  useEffect(() => { 
    if (libraries && libraries.length > 0) {
      const bounds = L.latLngBounds([lat, lng]);
      libraries.forEach(lib => {
        bounds.extend([lib.location.lat, lib.location.lng]);
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (lat && lng) {
      map.setView([lat, lng], 14); 
    }
  }, [lat, lng, libraries, map]);
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
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [userLoc, setUserLoc] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const fetchLibraries = async (lat, lng) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const query = `
        [out:json];
        (
          node["amenity"="library"](around:10000,${lat},${lng});
          way["amenity"="library"](around:10000,${lat},${lng});
          relation["amenity"="library"](around:10000,${lat},${lng});
        );
        out center;
      `;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await response.json();
      
      const libs = data.elements.map(el => {
        const isNode = el.type === "node";
        const libLat = isNode ? el.lat : el.center.lat;
        const libLng = isNode ? el.lon : el.center.lon;
        const name = el.tags?.name || "Unknown Library";
        
        const tags = el.tags || {};
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:postcode']
        ].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : "Address not available";
        
        return {
          _id: el.id,
          name,
          location: { lat: libLat, lng: libLng },
          address,
          distance: calculateDistance(lat, lng, libLat, libLng).toFixed(2),
        };
      });

      // Prevent duplicate markers
      const uniqueLibs = Array.from(new Map(libs.map(lib => [lib._id, lib])).values());
      
      // Sort by distance
      uniqueLibs.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setLibraries(uniqueLibs);
      if (uniqueLibs.length === 0) {
        setErrorMsg("No libraries found within 10 km.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch nearby libraries.");
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    setErrorMsg("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLoc({ lat, lng });
          fetchLibraries(lat, lng);
        },
        (error) => {
          console.error("Location error:", error);
          setErrorMsg("Location permission denied. Please allow access to your location.");
          setLoading(false);
        }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectLibrary = (lib) => {
    setSelectedLibrary(lib);
    setRouteInfo(null);
    if (viewMode === 'list') setViewMode('map');
  };

  const openInGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
            <h2 className={styles.title}>🏛️ Library Hub</h2>
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                onClick={getUserLocation} 
                style={{
                  background: '#f1f5f9', color: '#64748b', border: 'none', 
                  padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', 
                  fontSize: '0.75rem', fontWeight: 700
                }}
              >
                🔄 Refresh
              </button>
              <div className={styles.toggleGroup}>
                  <button className={viewMode === 'list' ? styles.activeToggle : ""} onClick={() => setViewMode('list')}>List</button>
                  <button className={viewMode === 'map' ? styles.activeToggle : ""} onClick={() => setViewMode('map')}>Map</button>
              </div>
            </div>
        </div>
        <p className={styles.subtitle}>Discover <strong>institutional</strong> collections near you</p>
      </header>

      {errorMsg && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {viewMode === "list" ? (
        <div className={styles.listContainer}>
          {!loading && libraries.length === 0 && !errorMsg ? (
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
                  <p className={styles.libDist}>📍 {lib.distance} km away</p>
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
          {userLoc && (
            <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={14} className={styles.map}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <RecenterMap lat={userLoc.lat} lng={userLoc.lng} libraries={libraries} />
              <Marker position={[userLoc.lat, userLoc.lng]}><Popup>You are here</Popup></Marker>
              {libraries.map(lib => (
                <Marker 
                  key={lib._id} 
                  position={[lib.location.lat, lib.location.lng]}
                  eventHandlers={{ click: () => { setSelectedLibrary(lib); setRouteInfo(null); } }}
                >
                  <Popup>
                    <strong>{lib.name}</strong><br/>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b' }}>{lib.address}</p>
                    <p style={{ margin: '4px 0', fontSize: '12px', fontWeight: 'bold' }}>{lib.distance} km away</p>
                    <button 
                      onClick={() => openInGoogleMaps(lib.location.lat, lib.location.lng)}
                      style={{
                        background: '#3b82f6', color: '#fff', border: 'none', 
                        padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', 
                        fontSize: '12px', width: '100%', marginTop: '5px'
                      }}
                    >
                      Open in Google Maps
                    </button>
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
          )}

          {/* Route Info Overlay */}
          {selectedLibrary && routeInfo && (
            <div style={{
              position: "absolute", top: "20px", right: "20px",
              background: "#f8fafc", backdropFilter: "blur(12px)", 
              padding: "16px", borderRadius: "20px", zIndex: 1000,
              border: "1px solid rgba(0, 0, 0, 0.08)", color: "#0f172a",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)", minWidth: "160px"
            }}>
              <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Travel Route</div>
              <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>{selectedLibrary.name}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Distance</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#6366f1" }}>{routeInfo.distance} km</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Time</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>{routeInfo.time} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className={styles.overlayLoader}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', border: '4px solid #f3f3f3', 
              borderTop: '4px solid #8b1874', borderRadius: '50%', animation: 'spin 1s linear infinite'
            }}></div>
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
            Fetching Nearby Libraries...
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyLibraries;
