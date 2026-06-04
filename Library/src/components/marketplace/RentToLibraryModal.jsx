import { useState, useEffect } from "react";
import { libraryAPI, libraryTransactionAPI } from "../../services/api";
import styles from "./RentToLibraryModal.module.css";
import Toast from "../Toast";

const RentToLibraryModal = ({ book, onClose, onComplete }) => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null); // stores libraryId being requested
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNearbyLibraries();
  }, []);

  const fetchNearbyLibraries = async () => {
    try {
      setLoading(true);
      // We use the library list and then calculate distances
      const res = await libraryAPI.getAll(); 
      if (res.data.success) {
        // In a real app, we'd use a server-side geospatial query with the user's current lat/lng
        // For demonstration, we'll assume the libraries returned are already sorted by distance
        // and filtered if the backend supports it.
        setLibraries(res.data.libraries || []);
      }
    } catch (err) {
      setToast({ message: "Failed to fetch libraries", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async (libraryId) => {
    try {
      setSubmitting(libraryId);
      const res = await libraryTransactionAPI.request({
        bookId: book._id,
        libraryId: libraryId
      });
      if (res.data.success) {
        setToast({ message: "Offering sent to library! 🏛️", type: "success" });
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to send offer", type: "error" });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <header className={styles.header}>
          <h3>Offer to Nearby Libraries</h3>
          <p>Select a library to rent your book "{book.title}" to.</p>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loader}>Searching for partners...</div>
          ) : libraries.length === 0 ? (
            <div className={styles.empty}>No nearby libraries found.</div>
          ) : (
            <div className={styles.list}>
              {libraries.map((lib) => (
                <div key={lib._id} className={styles.item}>
                  <div className={styles.libInfo}>
                    <div className={styles.libIcon}>🏛️</div>
                    <div>
                      <div className={styles.libName}>{lib.name}</div>
                      <div className={styles.libLoc}>{lib.address}</div>
                    </div>
                  </div>
                  <button 
                    className={styles.offerBtn}
                    onClick={() => handleOffer(lib._id)}
                    disabled={submitting === lib._id}
                  >
                    {submitting === lib._id ? "Sending..." : "Rent to Lib"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <p>Only libraries within 20km are eligible for physical returns.</p>
        </footer>
      </div>
    </div>
  );
};

export default RentToLibraryModal;
