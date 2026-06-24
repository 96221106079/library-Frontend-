// ============================================
// Libraries.jsx – Enhanced Public Libraries Page
// ============================================
//
// ENHANCEMENTS:
//  1. Marker Clustering via react-leaflet-cluster
//  2. Real-time search bar filtering by library name
//  3. Distance filter chips (1km / 5km / 10km / All)
//  4. Redesigned cards with OSM badge, hover animation, View on Map & Get Directions
//  5. FlyTo animation on card click, highlighted selected marker (green icon)
//  6. Skeleton loaders while data loads
//  7. No map-drag re-fetching – fetch only on mount & explicit Refresh
//  8. Fully responsive layout
//  9. Statistics bar (total / closest / radius)
// 10. Dark theme matching the Hybrid Library design system
//
// PRESERVED from previous version:
//  – Overpass API retry with exponential backoff + fallback mirror
//  – AbortController cleanup on unmount
//  – Safe JSON parsing, 429 handling
//  – hasFetchedRef StrictMode guard
//  – Deduplication via Set on OSM element id
//  – Navigation overlay card with routing

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./Libraries.module.css";

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ── Custom marker icons ───────────────────────────────────────────────────────
const SHADOW = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
const iconOpts = { shadowUrl: SHADOW, iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41] };

const blueIcon  = new L.Icon({ ...iconOpts, iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" });
const redIcon   = new L.Icon({ ...iconOpts, iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" });
const greenIcon = new L.Icon({ ...iconOpts, iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" });

// ── Overpass endpoints (primary + fallback mirrors) ────────────────────────────
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
];

// ── Haversine distance (km) ───────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Overpass fetch with retry + endpoint fallback ─────────────────────────────
const fetchFromOverpass = async (query, signal, maxRetries = 3) => {
  let endpointIdx = 0;
  let attempt = 0;

  while (attempt <= maxRetries) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIdx];
    console.log(`[Overpass] Attempt ${attempt + 1} → ${endpoint}`);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      });

      // 429 rate-limit handling
      if (res.status === 429) {
        const ra = res.headers.get("Retry-After");
        const waitMs = ra ? parseInt(ra, 10) * 1000 : 2000 * 2 ** attempt;
        console.warn(`[Overpass] 429 – waiting ${waitMs}ms`);
        endpointIdx = (endpointIdx + 1) % OVERPASS_ENDPOINTS.length;
        attempt++;
        if (attempt > maxRetries) throw new Error("RATE_LIMITED");
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP_${res.status}`);

      // Guard against non-JSON (XML) bodies
      const ct = res.headers.get("Content-Type") || "";
      if (!ct.includes("application/json") && !ct.includes("text/json")) {
        const raw = await res.text();
        console.error("[Overpass] Non-JSON:", raw.slice(0, 200));
        throw new Error("NON_JSON_RESPONSE");
      }

      const data = await res.json();
      console.log(`[Overpass] ✅ ${data.elements?.length ?? 0} elements`);
      return data;
    } catch (err) {
      if (err.name === "AbortError") throw err;
      console.warn(`[Overpass] Attempt ${attempt + 1} failed:`, err.message);
      endpointIdx = (endpointIdx + 1) % OVERPASS_ENDPOINTS.length;
      attempt++;
      if (attempt > maxRetries) throw new Error(`MAX_RETRIES: ${err.message}`);
      await sleep(2000 * 2 ** (attempt - 1));
    }
  }
};

// ── ENHANCEMENT #5: FlyTo selected library on map ─────────────────────────────
const FlyToLibrary = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

// ── Fit bounds to user + all libraries ────────────────────────────────────────
const FitBounds = ({ userLoc, libraries }) => {
  const map = useMap();
  useEffect(() => {
    if (!userLoc) return;
    if (libraries.length === 0) { map.setView([userLoc.lat, userLoc.lng], 13); return; }
    const bounds = L.latLngBounds([[userLoc.lat, userLoc.lng]]);
    libraries.forEach((lib) => bounds.extend([lib.lat, lib.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [userLoc, libraries, map]);
  return null;
};

// ── Routing (optional leaflet-routing-machine CDN) ────────────────────────────
const RoutingMachine = ({ userLoc, libLoc, onRouteInfo }) => {
  const map = useMap();
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLoc || !libLoc || !window.L?.Routing) return;
    if (ctrlRef.current) map.removeControl(ctrlRef.current);

    try {
      ctrlRef.current = window.L.Routing.control({
        waypoints: [window.L.latLng(userLoc.lat, userLoc.lng), window.L.latLng(libLoc.lat, libLoc.lng)],
        lineOptions: { styles: [{ color: "#818cf8", weight: 5, opacity: 0.8 }] },
        createMarker: () => null, addWaypoints: false, draggableWaypoints: false,
        fitSelectedRoutes: true, show: false,
      }).addTo(map);

      ctrlRef.current.on("routesfound", (e) => {
        const s = e.routes[0].summary;
        onRouteInfo({ distance: (s.totalDistance / 1000).toFixed(1), time: Math.round(s.totalTime / 60) });
      });
    } catch (e) { console.error("[Routing]", e); }

    return () => { if (ctrlRef.current && map) map.removeControl(ctrlRef.current); };
  }, [map, userLoc, libLoc, onRouteInfo]);

  return null;
};

// ── ENHANCEMENT #6: Skeleton card for loading state ───────────────────────────
const SkeletonCard = () => (
  <div className={styles.card} style={{ pointerEvents: "none" }}>
    <div className={styles.cardBody}>
      <div className={styles.skeletonLine} style={{ width: "70%", height: 18, marginBottom: 10 }} />
      <div className={styles.skeletonLine} style={{ width: "40%", height: 14, marginBottom: 16 }} />
      <div className={styles.skeletonLine} style={{ width: "90%", height: 14, marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <div className={styles.skeletonLine} style={{ flex: 1, height: 38, borderRadius: 12 }} />
        <div className={styles.skeletonLine} style={{ flex: 1, height: 38, borderRadius: 12 }} />
      </div>
    </div>
  </div>
);

// ── Radius options ───────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { label: "1 km",  value: 1 },
  { label: "3 km",  value: 3 },
  { label: "5 km",  value: 5 },
  { label: "10 km", value: 10 },
];

// ══════════════════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Libraries = () => {
  const [userLoc,       setUserLoc]       = useState(null);
  const [libraries,     setLibraries]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [expandingMsg,  setExpandingMsg]  = useState(null);
  const [activeLibrary, setActiveLibrary] = useState(null);
  const [routeInfo,     setRouteInfo]     = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(5);

  const hasFetchedRef = useRef(false);
  const abortCtrlRef  = useRef(null);
  const markerRefs    = useRef({});
  const mapRef        = useRef(null);

  const parseElements = useCallback((elements, lat, lng, radiusKm) => {
    const seen = new Set();
    const libs = [];
    for (const el of elements) {
      if (seen.has(el.id)) continue;
      seen.add(el.id);
      
      const libLat = el.type === "node" ? el.lat : el.center?.lat;
      const libLng = el.type === "node" ? el.lon : el.center?.lon;
      
      if (!libLat || !libLng) continue;

      const dist = parseFloat(haversine(lat, lng, libLat, libLng).toFixed(2));
      
      if (dist > radiusKm + 0.1) continue;

      const tags = el.tags || {};
      
      const name = tags.name || tags.operator || tags.brand || tags.official_name || tags.short_name || "Public Library";
      
      const addrParts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:city"],
        tags["addr:district"],
        tags["addr:state"],
      ].filter(Boolean);
      const address = addrParts.length > 0 ? addrParts.join(", ") : "Location available on map";
      
      libs.push({
        _id: String(el.id),
        osmType: el.type,
        name,
        lat: libLat, lng: libLng,
        address,
        distance: dist,
      });
    }
    libs.sort((a, b) => a.distance - b.distance);
    return libs;
  }, []);

  const loadLibraries = useCallback(async (lat, lng, radiusKm, isAutoExpand = false) => {
    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    abortCtrlRef.current = new AbortController();
    
    if (isAutoExpand) {
      setExpandingMsg(`No libraries found within 1 km. Expanding search radius to 5 km...`);
    } else {
      setExpandingMsg(null);
      setLoading(true);
    }
    setError(null);
    console.log(`[Libraries] Fetching near (${lat.toFixed(4)}, ${lng.toFixed(4)}) with radius ${radiusKm} km`);

    const radiusMeters = radiusKm * 1000;
    const query = `[out:json][timeout:30];
(
  node["amenity"="library"](around:${radiusMeters},${lat},${lng});
  way["amenity"="library"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="library"](around:${radiusMeters},${lat},${lng});
);
out center;`;

    try {
      const data = await fetchFromOverpass(query, abortCtrlRef.current.signal);
      const libs = parseElements(data.elements || [], lat, lng, radiusKm);
      
      console.log(`[Libraries] Selected radius: ${radiusKm} km. Found ${libs.length} results.`);
      
      if (libs.length === 0) {
        if (radiusKm === 1 && !isAutoExpand) {
          console.log("[Libraries] No libraries at 1km, auto-expanding to 5km");
          setSearchRadius(5);
          return loadLibraries(lat, lng, 5, true);
        } else {
          setError(`No libraries found within ${radiusKm} km.`);
        }
      }
      
      setLibraries(libs);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("[Overpass Error]:", err.message);
      if (err.message === "RATE_LIMITED") setError("Map service is busy (rate limit). Wait 30s then tap Refresh.");
      else if (err.message === "NON_JSON_RESPONSE") setError("Unexpected response from map service. Try again.");
      else setError("Could not load libraries. Check your connection and tap Refresh.");
    } finally {
      setLoading(false);
      setExpandingMsg(null);
    }
  }, [parseElements]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    console.log("[Libraries] Mounted – requesting geolocation");

    if (!navigator.geolocation) {
      console.error("[Geolocation Error]: Browser does not support geolocation.");
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        console.log(`[Geolocation Success]: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setUserLoc({ lat, lng });
        loadLibraries(lat, lng, searchRadius);
      },
      (err) => {
        console.error("[Geolocation Error]:", err.message);
        setError("Location access denied. Enable permissions and tap Refresh.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      if (abortCtrlRef.current) abortCtrlRef.current.abort();
    };
  }, [loadLibraries, searchRadius]);

  const handleRefresh = useCallback(() => {
    hasFetchedRef.current = false;
    setLoading(true); setError(null); setLibraries([]);
    setActiveLibrary(null); setRouteInfo(null); setSearchQuery(""); setExpandingMsg(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported."); setLoading(false); return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLoc({ lat, lng });
        loadLibraries(lat, lng, searchRadius);
        hasFetchedRef.current = true;
      },
      (err) => {
        console.error("[Geolocation Error during Refresh]:", err.message);
        setError("Could not get location. Check permissions."); setLoading(false);
        hasFetchedRef.current = true;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [loadLibraries, searchRadius]);

  const handleRadiusChange = (newRadius) => {
    setSearchRadius(newRadius);
    setSearchQuery("");
    if (userLoc) {
      loadLibraries(userLoc.lat, userLoc.lng, newRadius);
    }
  };

  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      if (searchQuery && !lib.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [libraries, searchQuery]);

  const stats = useMemo(() => ({
    total:   filteredLibraries.length,
    closest: filteredLibraries.length > 0 ? filteredLibraries[0].distance : null,
    radius:  searchRadius,
  }), [filteredLibraries, searchRadius]);

  const handleViewOnMap = async (lib) => {
    setActiveLibrary(lib);
    setRouteInfo(null);
    const el = markerRefs.current[lib._id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    if (!userLoc) return;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${lib.lng},${lib.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found in API response");
      }
      
      setRouteInfo({
        distance: (data.routes[0].distance / 1000).toFixed(1),
        time: Math.round(data.routes[0].duration / 60),
      });
    } catch (e) {
      console.error("[Route API Error]:", e.message, "— Falling back to Haversine walking estimate.");
      const dist = lib.distance;
      const walkingSpeedKmh = 5;
      const timeMins = Math.round((dist / walkingSpeedKmh) * 60);
      setRouteInfo({
        distance: dist.toFixed(1),
        time: timeMins,
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Public Libraries</h1>
            <p className={styles.subtitle}>Discover institutional collections near you</p>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={loading || expandingMsg}
          >
            {loading || expandingMsg ? (
              <><span className={styles.refreshSpinner} /> Loading…</>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>
        </div>
      </header>

      {expandingMsg && (
        <div style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.1))",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          color: "#6366f1",
          padding: "12px 20px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span className={styles.refreshSpinner} style={{ width: 12, height: 12, borderWidth: 2 }} />
          {expandingMsg}
        </div>
      )}

      {loading && !expandingMsg && (
        <div>
          <div className={styles.mapSkeleton}>
            <div className={styles.spinner} />
            <p className={styles.loaderText}>Finding libraries near you...</p>
          </div>
          <div className={styles.cardGrid} style={{ marginTop: 20 }}>
            {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorIconWrap}>⚠️</div>
          <div>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={handleRefresh}>Try Again</button>
          </div>
        </div>
      )}

      {(!loading || expandingMsg) && !error && (<>
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statDesc}>Libraries Found</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {stats.closest !== null ? `${stats.closest} km` : "—"}
            </span>
            <span className={styles.statDesc}>Closest Library</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.radius} km</span>
            <span className={styles.statDesc}>Search Radius</span>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search libraries by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              disabled={expandingMsg}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          <div className={styles.filterChips}>
            {RADIUS_OPTIONS.map((f) => (
              <button
                key={f.value}
                className={`${styles.chip} ${searchRadius === f.value ? styles.chipActive : ""}`}
                onClick={() => handleRadiusChange(f.value)}
                disabled={expandingMsg || loading}
                style={{ opacity: (expandingMsg || loading) && searchRadius !== f.value ? 0.5 : 1 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {userLoc && (
          <div className={styles.mapWrapper} style={{ opacity: expandingMsg ? 0.6 : 1, transition: "opacity 0.3s" }}>
            <MapContainer
              center={[userLoc.lat, userLoc.lng]}
              zoom={13}
              className={styles.map}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />

              {!activeLibrary && <FitBounds userLoc={userLoc} libraries={filteredLibraries} />}
              {activeLibrary && <FlyToLibrary lat={activeLibrary.lat} lng={activeLibrary.lng} />}

              <Marker position={[userLoc.lat, userLoc.lng]} icon={blueIcon}>
                <Popup><b>📍 You are here</b></Popup>
              </Marker>

              <MarkerClusterGroup
                chunkedLoading
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                maxClusterRadius={60}
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount();
                  return L.divIcon({
                    html: `<div class="${styles.clusterIcon}">${count}</div>`,
                    className: styles.clusterWrapper,
                    iconSize: L.point(44, 44),
                  });
                }}
              >
                {filteredLibraries.map((lib) => (
                  <Marker
                    key={lib._id}
                    position={[lib.lat, lib.lng]}
                    icon={activeLibrary?._id === lib._id ? greenIcon : redIcon}
                    eventHandlers={{
                      click: () => { handleViewOnMap(lib); },
                    }}
                  >
                    <Popup>
                      <div style={{ textAlign: "center", minWidth: 200, fontFamily: "Inter, sans-serif" }}>
                        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{lib.name}</p>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>{lib.address}</p>
                        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                          📍 {lib.distance} km away
                        </p>
                        <button
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lib.lat},${lib.lng}`, "_blank")}
                          style={{
                            background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff",
                            border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                            fontSize: 12, fontWeight: 700, width: "100%",
                          }}
                        >
                          🧭 Open in Google Maps
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>

              {/* Routing */}
              {activeLibrary && userLoc && (
                <RoutingMachine userLoc={userLoc} libLoc={activeLibrary} onRouteInfo={setRouteInfo} />
              )}
            </MapContainer>
          </div>
        )}

        {/* ── LIBRARY CARDS ───────────────────────────────────────────────── */}
        <section className={styles.cardsSection}>
          {filteredLibraries.length === 0 && !expandingMsg ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <h3 className={styles.emptyTitle}>
                {searchQuery ? "No matching libraries" : "No libraries in this range"}
              </h3>
              <p className={styles.emptyText}>
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : "Try increasing the distance filter or tap Refresh."}
              </p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filteredLibraries.map((lib) => (
                <div
                  key={lib._id}
                  ref={(el) => (markerRefs.current[lib._id] = el)}
                  className={`${styles.card} ${activeLibrary?._id === lib._id ? styles.activeCard : ""}`}
                >
                  <div className={styles.cardBody}>
                    {/* Card header */}
                    <div className={styles.cardHeader}>
                      <h3 className={styles.libName}>{lib.name}</h3>
                      <span className={styles.distBadge}>📍 {lib.distance} km</span>
                    </div>

                    {/* Address */}
                    <p className={styles.libAddress}>{lib.address}</p>

                    {/* ENHANCEMENT #4: OSM source badge */}
                    <div className={styles.osmBadge}>
                      <span>🌐</span> OpenStreetMap
                    </div>

                    {/* ENHANCEMENT #4: Action buttons */}
                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewMapBtn}
                        onClick={() => handleViewOnMap(lib)}
                      >
                        🗺️ View on Map
                      </button>
                      <button
                        className={styles.directionsBtn}
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lib.lat},${lib.lng}`, "_blank")}
                      >
                        🧭 Directions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>)}

      {/* ── NAVIGATION OVERLAY ────────────────────────────────────────────── */}
      {activeLibrary && userLoc && (
        <div className={styles.navOverlay}>
          <div className={styles.navCard}>
            <div className={styles.navHeader}>
              <div className={styles.navTitleRow}>
                <h3 className={styles.navLibName}>{activeLibrary.name}</h3>
                <button
                  className={styles.closeNav}
                  onClick={() => { setActiveLibrary(null); setRouteInfo(null); }}
                >✕</button>
              </div>
              <p className={styles.navAddress}>{activeLibrary.address}</p>
            </div>

            <div className={styles.navStats}>
              <div className={styles.navStat}>
                <span className={styles.statLabel}>Distance</span>
                <span className={styles.statVal}>
                  {routeInfo ? `${routeInfo.distance} km` : `${activeLibrary.distance} km`}
                </span>
              </div>
              <div className={styles.navStat}>
                <span className={styles.statLabel}>Travel Time</span>
                <span className={styles.statVal}>
                  {routeInfo ? `${routeInfo.time} min` : "Calculating…"}
                </span>
              </div>
            </div>

            <div className={styles.navActions}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${activeLibrary.lat},${activeLibrary.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleMapsBtn}
              >
                <img
                  src="https://www.google.com/images/branding/product/2x/maps_96dp.png"
                  alt="Google Maps"
                  style={{ width: 20 }}
                />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Libraries;