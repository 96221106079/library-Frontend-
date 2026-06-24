// ============================================
// MapModal.jsx - Leaflet Map Modal
// ============================================
import { useEffect, useRef } from "react";
import styles from "./MapModal.module.css";
import useSocketTracking from "../../hooks/useSocketTracking";

const MapModal = ({ isOpen, onClose, book }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = currentUser.id === (book.ownerId?._id || book.ownerId || book.owner?._id || book.owner);

  const { remoteLocation, startTracking, stopTracking, isTracking } = useSocketTracking(book._id || book.id, isOwner);

  useEffect(() => {
    if (!isOpen || !book) return;
    
    const ownerNameDisplay = book.ownerId?.username || book.ownerId?.name || book.owner?.username || book.ownerName || "Book Owner";

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await new Promise((r) => setTimeout(r, 100));

      if (!mapRef.current || mapInstanceRef.current) return;

      const userCoords = [book.location?.coordinates?.[1] || 28.6129, book.location?.coordinates?.[0] || 77.208];
      const ownerCoords = [book.location?.coordinates?.[1] || 28.6145, book.location?.coordinates?.[0] || 77.209];

      const map = L.map(mapRef.current).setView(ownerCoords, 16);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Icons
      const userIcon = L.divIcon({
        html: `<div style="background:#3b82f6; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid #fff; display:flex; align-items:center; justify-content:center;"><span style="transform:rotate(45deg); font-size:12px;">👤</span></div>`,
        iconSize: [30, 30], iconAnchor: [15, 30],
      });

      const ownerIcon = L.divIcon({
        html: `<div style="background:#10b981; width:32px; height:32px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); border:2px solid #fff; display:flex; align-items:center; justify-content:center;"><span style="transform:rotate(45deg); font-size:14px;">📚</span></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32],
      });

      L.marker(userCoords, { icon: userIcon }).addTo(map).bindPopup("Your Location");
      
      markerRef.current = L.marker(ownerCoords, { icon: ownerIcon }).addTo(map).bindPopup(`<b>${ownerNameDisplay}</b><br>Live Location`);

      polylineRef.current = L.polyline([userCoords, ownerCoords], { color: "#6366f1", dashArray: "5, 10" }).addTo(map);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, book]);

  // Handle remote location updates
  useEffect(() => {
    if (remoteLocation && markerRef.current && mapInstanceRef.current) {
        const newPos = [remoteLocation.lat, remoteLocation.lng];
        markerRef.current.setLatLng(newPos);
        
        // Update polyline if userCoords is available
        const userCoords = [book.location?.coordinates?.[1] || 0, book.location?.coordinates?.[0] || 0];
        if (polylineRef.current) {
            polylineRef.current.setLatLngs([userCoords, newPos]);
        }
    }
  }, [remoteLocation, book]);

  if (!isOpen || !book) return null;
  const ownerNameDisplay = book.ownerId?.username || book.ownerId?.name || book.owner?.username || book.ownerName || "Unknown Owner";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Track Owner</h3>
            <p className={styles.subtitle}>{ownerNameDisplay} · {book.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isOwner && (
              !isTracking ? (
                <button onClick={startTracking} style={{ background: "#10b981", border: "none", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Start Sharing</button>
              ) : (
                <button onClick={stopTracking} style={{ background: "#ef4444", border: "none", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Stop Sharing</button>
              )
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close map">✕</button>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#3b82f6" }} />
            <span>Your Location</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.dot} style={{ background: "#10b981" }} />
            <span>Book Owner</span>
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapRef} className={styles.mapContainer} />

        {/* Distance Info */}
        <div className={styles.footer}>
          <span>📏 Distance to owner:</span>
          <strong>{book.distance}</strong>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
