import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./HomePage.module.css";
import { booksAPI, libraryAPI } from "../services/api";
import BookCard from "../components/marketplace/BookCard";
import BorrowRentModal from "../components/marketplace/BorrowRentModal";
import { useNavigate } from "react-router-dom";

// Fix for default leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;

// Custom Icons
const locationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically update map center
const MapZoom = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom() || 13);
    }
  }, [position, map]);
  return null;
};

const HomePage = () => {
    const navigate = useNavigate();
    const [position, setPosition] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    
    // Data fetching states
    const [books, setBooks] = useState([]);
    const [libraries, setLibraries] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, book: null, type: "" });

    const markerRef = useRef(null);

    // 1. Center map on user location on load
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => {
                    setErrorMsg("Location access denied or unavailable. Defaulting to Bangalore.");
                    setPosition([12.9716, 77.5946]); // Bangalore default
                }
            );
        } else {
            setErrorMsg("Geolocation is not supported by your browser. Defaulting to Bangalore.");
            setPosition([12.9716, 77.5946]); // Bangalore default
        }
    }, []);

    // 2. Fetch nearby libraries and books when position changes
    useEffect(() => {
        if (position) {
            setLoadingData(true);
            const [lat, lng] = position;
            
            Promise.all([
                booksAPI.getAll(),
                libraryAPI.getNearby(lat, lng, 10)
            ])
            .then(([booksRes, libsRes]) => {
                if (booksRes.data.success) {
                    // Provide a default distance label for standard books since getAll doesn't include it
                    const allBooks = (booksRes.data.books || []).map(b => ({
                        ...b,
                        distanceLabel: 'Available'
                    }));
                    setBooks(allBooks);
                }
                if (libsRes.data.success) {
                    setLibraries(libsRes.data.libraries || []);
                }
            })
            .catch(err => console.error("Failed to fetch data", err))
            .finally(() => setLoadingData(false));
        }
    }, [position]);

    // 3. Draggable pin to update latitude & longitude manually
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const latlng = marker.getLatLng();
                    setPosition([latlng.lat, latlng.lng]);
                }
            },
        }),
        [],
    );

    const handleBuy = (book) => setModal({ isOpen: true, book, type: "buy" });
    const handleRent = (book) => setModal({ isOpen: true, book, type: "rent" });
    const closeModal = () => setModal({ isOpen: false, book: null, type: "" });

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1>Discover Readers Around You</h1>
                <p>📍 You can drag the pin to explore books in other areas.</p>
            </div>

            {/* TOP OF HOMEPAGE: Leaflet Map */}
            <div className={styles.mapWrapper}>
                {errorMsg && !position ? (
                    <div className={styles.errorBox}>{errorMsg}</div>
                ) : position ? (
                    <MapContainer center={position} zoom={13} className={styles.map}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {/* 📍 User location marker & 📌 Draggable pin */}
                        <Marker 
                            draggable={true}
                            eventHandlers={eventHandlers}
                            position={position}
                            ref={markerRef}
                            icon={locationIcon}
                        >
                            <Popup>📌 I am draggable! Move me to find books elsewhere.</Popup>
                        </Marker>
                        <MapZoom position={position} />
                    </MapContainer>
                ) : (
                    <div className={styles.loadingBox}>
                        <p>Locating you...</p>
                        <div className={styles.spinner}></div>
                    </div>
                )}
            </div>

            {/* Bottom section: Content */}
            <div className={styles.contentSection}>
                <div className={styles.locationTag}>
                    Showing results for: <strong>{position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : "..."}</strong>
                </div>

                {loadingData ? (
                    <div className={styles.loaderContainer}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : (
                    <>
                        {/* Nearby Libraries */}
                        {libraries.length > 0 && (
                            <div className={styles.librarySection}>
                                <h2 className={styles.sectionTitle}>🏛️ Institutional Libraries Nearby</h2>
                                <div className={styles.libGrid}>
                                    {libraries.map(lib => (
                                        <div key={lib._id} className={styles.libCard} onClick={() => navigate("/nearby-libraries")}>
                                            <h4>{lib.name}</h4>
                                            <p>{lib.distanceLabel || "Near you"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All P2P Books */}
                        <h2 className={styles.sectionTitle} style={{ marginTop: libraries.length > 0 ? "2rem" : "0" }}>
                            📚 All Peer-to-Peer Books
                        </h2>
                        {books.length > 0 ? (
                            <div className={styles.productGrid}>
                                {books.map(book => (
                                    <div key={book._id} className={styles.productWrapper}>
                                        <BookCard 
                                            book={book} 
                                            onBuy={() => handleBuy(book)} 
                                            onRent={() => handleRent(book)} 
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📭</span>
                                <p>No P2P books found.</p>
                                <button className={styles.actionBtn} onClick={() => navigate("/add-book")}>Be the first to list a book!</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <BorrowRentModal 
                isOpen={modal.isOpen}
                onClose={closeModal}
                book={modal.book}
                type={modal.type}
            />
        </div>
    );
};

export default HomePage;
