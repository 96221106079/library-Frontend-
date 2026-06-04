// ============================================
// Libraries.jsx - Public Libraries + Books + Transaction Flow
// ============================================
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { userAPI, libraryAPI } from "../services/api";
import styles from "./Libraries.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
const blueIcon = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png", iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });
const redIcon  = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png", iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] });

const RecenterMap = ({ lat, lng }) => { const map = useMap(); useEffect(() => { if (lat && lng) map.setView([lat, lng], 11); }, [lat, lng, map]); return null; };
const MapEvents = ({ onMoveEnd }) => { const map = useMap(); useEffect(() => { const h = () => { const c = map.getCenter(); onMoveEnd(c.lat, c.lng); }; map.on("moveend", h); return () => map.off("moveend", h); }, [map, onMoveEnd]); return null; };

// Routing Control Component
const RoutingMachine = ({ userLoc, libLoc, onRouteInfo }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc || !libLoc) return;
    if (!window.L || !window.L.Routing) return;

    // Remove existing control if any
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
          styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }]
        },
        createMarker: () => null, // We use our own markers
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false // Keep the text instructions hidden for cleaner UI
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

// ============================
//    BOOKS MODAL COMPONENT
// ============================
const STEP = { LIST: "list", CONFIRM: "confirm", OTP: "otp" };

const BooksModal = ({ library, userLoc, onClose }) => {
  const [books, setBooks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [step, setStep]                 = useState(STEP.LIST);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [txnData, setTxnData]           = useState(null);
  const [otpCode, setOtpCode]           = useState("");
  const [placing, setPlacing]           = useState(false);

  // Detect if this is an OSM library (string _id) vs MongoDB library (ObjectId)
  const isOsmLibrary = !library._id || typeof library._id === "string" && (library._id.startsWith("osm_") || library._id.startsWith("nom_"));

  // ---- Fetch books ----
  useEffect(() => {
    (async () => {
      try {
        let res;
        if (isOsmLibrary) {
          res = await libraryAPI.getBooksByName(library.name);
        } else {
          res = await libraryAPI.getBooks(library._id);
        }
        setBooks(res.data?.books || []);
      } catch (err) {
        console.error("Book fetch error:", err);
        setError("Could not load books for this library.");
      } finally { setLoading(false); }
    })();
  }, [library._id, library.name, isOsmLibrary]);

  // ---- Step 1 -> 2: User clicks Borrow/Rent ----
  const handleAction = (book, type) => {
    setSelectedBook(book);
    setSelectedType(type);
    setStep(STEP.CONFIRM);
  };

  // ---- Step 2 -> 3: Confirm -> create order via libraryAPI (generates OTP) ----
  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      // For DB-backed libraries, use their _id.
      // For OSM libraries (no real _id), we still pass it and the backend
      // will gracefully skip the library distance check.
      const res = await libraryAPI.createOrder({
        bookId: selectedBook._id,
        libraryId: library._id,       // MongoDB _id for DB libs, string for OSM
        type: selectedType,
        userLat: userLoc?.lat,
        userLng: userLoc?.lng,
      });

      setTxnData(res.data);
      setOtpCode(res.data.otp);
      setStep(STEP.OTP);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place request.");
    } finally { setPlacing(false); }
  };

  const backStep = () => {
    if (step === STEP.CONFIRM) setStep(STEP.LIST);
    else if (step === STEP.OTP) setStep(STEP.CONFIRM);
  };

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* HEADER */}
        <div className={styles.modalHeader}>
          <div>
            {step !== STEP.LIST && <button className={styles.backBtn} onClick={backStep}>&#8592; Back</button>}
            <h2 className={styles.modalTitle}>
              {step === STEP.LIST    && <span>&#128218; {library.name}</span>}
              {step === STEP.CONFIRM && <span>&#128203; Confirm {selectedType === "rent" ? "Rent" : "Borrow"}</span>}
              {step === STEP.OTP     && <span>&#128274; Your OTP</span>}
            </h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        </div>

        {/* BODY */}
        <div className={styles.modalBody}>

          {/* ======= STEP: LIST ======= */}
          {step === STEP.LIST && (<>
            {loading && <div className={styles.loaderWrap}><div className={styles.spinner} /><p className={styles.loaderText}>Fetching catalogue...</p></div>}
            
            {/* OSM LIBRARY NOTICE */}
            {isOsmLibrary && !loading && (
              <div className={styles.osmNoticeCard}>
                <div className={styles.osmIcon}>🌐</div>
                <div className={styles.osmInfo}>
                  <h3>OpenStreetMap Collection</h3>
                  <p>This is a community-listed library. A digital catalog is not yet available, but you can visit the physical location using the route provided.</p>
                </div>
              </div>
            )}

            {error && !loading && <div className={styles.infoNotice}>{error}</div>}
            {!isOsmLibrary && !loading && !error && books.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>&#128493;</div>
                <h3 className={styles.emptyTitle}>No books listed</h3>
              </div>
            )}
            {!isOsmLibrary && !loading && books.length > 0 && (
              <div className={styles.bookGrid}>
                {books.map(book => (
                  <div key={book._id} className={styles.bookCard}>
                    <div className={styles.bookCover}>
                      {book.image ? <img src={book.image} alt={book.title} className={styles.bookImg} /> : null}
                      <div className={styles.bookPlaceholder}>&#128214;</div>
                    </div>
                    <div className={styles.bookInfo}>
                      <h4 className={styles.bookTitle}>{book.title}</h4>
                      <p className={styles.bookAuthor}>by {book.author}</p>
                      <div className={styles.bookPrices} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {book.buyPrice > 0 && <span className={styles.priceTag} style={{background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none'}}>Buy: &#8377;{book.buyPrice}</span>}
                        {(book.rentPrice > 0) && <span className={styles.priceTag} style={{background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none'}}>Rent: &#8377;{book.rentPrice}/day</span>}
                      </div>
                    </div>
                    <div className={styles.bookActions}>
                      <button className={styles.actionBtn + " " + styles.rentBtn} disabled={!book.isAvailable} onClick={() => handleAction(book, "borrow")}>Borrow</button>
                      <button className={styles.actionBtn + " " + styles.buyBtn} disabled={!book.isAvailable} onClick={() => handleAction(book, "rent")}>Rent</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {/* ======= STEP: CONFIRM ======= */}
          {step === STEP.CONFIRM && selectedBook && (
            <div className={styles.confirmPanel}>
              <div className={styles.confirmBook}>
                <div className={styles.confirmIcon}>&#128214;</div>
                <div>
                  <h3 className={styles.confirmTitle}>{selectedBook.title}</h3>
                  <p className={styles.confirmAuthor}>by {selectedBook.author}</p>
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Action</span>
                <span className={styles.infoVal}>{selectedType === "rent" ? "Rent" : "Borrow"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Library</span>
                <span className={styles.infoVal}>{library.name}</span>
              </div>
              <button className={styles.confirmBtn} disabled={placing} onClick={handlePlaceOrder}>
                {placing ? "Processing..." : "Generate Handover OTP"}
              </button>
            </div>
          )}

          {/* ======= STEP: OTP (Now REQUEST SUBMITTED) ======= */}
          {step === STEP.OTP && (
            <div className={styles.otpPanel}>
              <div className={styles.otpHeader}>
                <div className={styles.otpIcon}>📨</div>
                <h3 className={styles.otpTitle}>Request Submitted!</h3>
                <p className={styles.otpSub}>Your borrow request has been sent to <strong>{library.name}</strong> staff.</p>
              </div>

              <div className={styles.otpDisplay} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <span className={styles.otpLabel} style={{ color: '#a5b4fc', fontSize: '14px' }}>
                  Once a librarian accepts your request, your unique handover code will appear in your <strong>Activity</strong> tab.
                </span>
              </div>

              <div className={styles.successPanel} style={{marginTop: 20}}>
                <div className={styles.loaderWrap} style={{minHeight: 0}}>
                  <div className={styles.spinner} style={{width: 20, height: 20, borderWidth: 2}}></div>
                  <p style={{fontSize: 13, color: "#64748b", margin: 0}}>Waiting for staff approval...</p>
                </div>
              </div>

              <button className={styles.confirmBtn} style={{marginTop: 20}} onClick={() => {
                onClose();
                window.location.href = "/activity";
              }}>
                Go to Activity Tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================
//    MAIN LIBRARIES PAGE
// ============================
let debounceTimer;

const Libraries = () => {
  const [userLoc, setUserLoc]             = useState(null);
  const [searchCenter, setSearchCenter]   = useState(null);
  const [libraries, setLibraries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [isUpdating, setIsUpdating]       = useState(false);
  const [error, setError]                 = useState(null);
  const [activeLibrary, setActiveLibrary] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const watchIdRef     = useRef(null);
  const lastUpdateRef  = useRef({ lat: 0, lng: 0 });
  const markerRefs     = useRef({});

  // Helper: Get distance between two points (in km)
  const getDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchLibraries = useCallback(async (lat, lng, initPhase = false) => {
    if (!initPhase) setIsUpdating(true);
    try {
      const res = await libraryAPI.getAll(lat, lng, 20);
      setLibraries(Array.isArray(res.data) ? res.data : []);
      setSearchCenter({ lat, lng });
      lastUpdateRef.current = { lat, lng };
    } catch (err) {
      console.error("Libraries fetch error:", err);
      if (initPhase) setError("Failed to load libraries.");
    } finally {
      if (initPhase) setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  const handleMapMove = useCallback((lat, lng) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const moved = getDist(lat, lng, lastUpdateRef.current.lat, lastUpdateRef.current.lng);
      if (moved > 0.5) { // Only refetch if moved > 500m via manual map pan
        fetchLibraries(lat, lng, false);
      }
    }, 1500);
  }, [fetchLibraries]);

  // ---- 1. Tracking and Initialization ----
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Start watching position immediately
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const currentPos = { lat: latitude, lng: longitude };
        
        setUserLoc(currentPos);

        // Initial fetch or significant move
        const movedSinceLastFetch = getDist(latitude, longitude, lastUpdateRef.current.lat, lastUpdateRef.current.lng);
        if (lastUpdateRef.current.lat === 0 || movedSinceLastFetch > 0.2) { // 200m moved
          fetchLibraries(latitude, longitude, lastUpdateRef.current.lat === 0);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        // Fallback to static Bangalore if GPS fails
        if (lastUpdateRef.current.lat === 0) fetchLibraries(12.9716, 77.5946, true);
      },
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => { 
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [fetchLibraries]);

  const handleMarkerClick = (id) => { 
    const el = markerRefs.current[id]; 
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); 
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 className={styles.title}>Public Libraries</h1>
            <p className={styles.subtitle}>Discover institutional collections and borrow books</p>
          </div>
        </div>
      </header>

      {loading && <div className={styles.loaderWrap}><div className={styles.spinner} /><p className={styles.loaderText}>Locating libraries...</p></div>}
      
      {!loading && !error && (<>
        {userLoc && (
          <div className={styles.mapWrapper}>
            <MapContainer center={[userLoc.lat, userLoc.lng]} zoom={13} className={styles.map}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <MapEvents onMoveEnd={handleMapMove} />
              <RecenterMap lat={userLoc.lat} lng={userLoc.lng} />
              
              <Marker position={[userLoc.lat, userLoc.lng]} icon={blueIcon}>
                <Popup><b>You are here</b><br/>GPS Level: High Accuracy</Popup>
              </Marker>

              {libraries.map(lib => (
                <Marker 
                  key={lib._id} 
                  position={[lib.lat, lib.lng]} 
                  icon={redIcon} 
                  eventHandlers={{click: () => { handleMarkerClick(lib._id); setActiveLibrary(lib); }}}
                >
                  <Popup>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>{lib.name}</p>
                        <button onClick={() => setActiveLibrary(lib)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>📍 Navigate</button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* ROUTE ENGINE */}
              {activeLibrary && userLoc && (
                <RoutingMachine 
                  userLoc={userLoc} 
                  libLoc={activeLibrary} 
                  onRouteInfo={setRouteInfo} 
                />
              )}
            </MapContainer>
          </div>
        )}

        <section className={styles.cardsSection}>
          <div className={styles.cardGrid}>
            {libraries.map(lib => (
              <div key={lib._id} ref={el => (markerRefs.current[lib._id] = el)} className={`${styles.card} ${activeLibrary?._id === lib._id ? styles.activeCard : ''}`}>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.libName}>{lib.name}</h3>
                    <span className={styles.distBadge}>📍 {lib.distanceLabel || `${lib.distance}km`}</span>
                  </div>
                  <p className={styles.libAddress}>{lib.address}</p>
                  
                  <div className={styles.cardActions}>
                    <button 
                      className={styles.routeBtn} 
                      onClick={() => { setActiveLibrary(lib); setRouteInfo(null); }}
                      style={{ width: '100%' }}
                    >
                      🧭 View Path & Route
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>)}

      {/* GOOGLE MAPS STYLE NAVIGATION CARD */}
      {activeLibrary && (
        <div className={styles.navOverlay}>
          <div className={styles.navCard}>
            <div className={styles.navHeader}>
              <div className={styles.navTitleRow}>
                <h3 className={styles.navLibName}>{activeLibrary.name}</h3>
                <button className={styles.closeNav} onClick={() => { setActiveLibrary(null); setRouteInfo(null); }}>✕</button>
              </div>
              <p className={styles.navAddress}>{activeLibrary.address}</p>
            </div>
            
            <div className={styles.navStats}>
              <div className={styles.navStat}>
                <span className={styles.statLabel}>Distance</span>
                <span className={styles.statVal}>{routeInfo ? `${routeInfo.distance} km` : activeLibrary.distanceLabel || '...'}</span>
              </div>
              <div className={styles.navStat}>
                <span className={styles.statLabel}>Travel Time</span>
                <span className={styles.statVal}>{routeInfo ? `${routeInfo.time} min` : 'Calculating...'}</span>
              </div>
            </div>

            <div className={styles.navActions}>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${activeLibrary.lat},${activeLibrary.lng}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.googleMapsBtn}
                style={{ width: '100%' }}
              >
                <img src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="G" style={{width: 20}} />
                Open with Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Libraries;