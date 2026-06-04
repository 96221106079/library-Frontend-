import { useState } from "react";
import { orderAPI } from "../../services/api";
import styles from "./LibraryBookDetailModal.module.css";

const LibraryBookDetailModal = ({ book, library, onClose }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: Choose Rent/Buy
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleAction = async (type) => {
        setLoading(true);
        setError(null);
        try {
            const res = await orderAPI.create(book._id, type);
            if (res.data.success) {
                setSuccess(true);
                setTimeout(onClose, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Order failed.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.successWrapper}>
                        <span className={styles.checkIcon}>✅</span>
                        <h3>Order Placed!</h3>
                        <p>Track your book in the Activity section.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {step === 1 ? (
                    <>
                        <div className={styles.header}>
                            <div className={styles.bookImage}>
                                <span className={styles.placeholder}>📚</span>
                            </div>
                            <div className={styles.bookMain}>
                                <h2 className={styles.title}>{book.title}</h2>
                                <p className={styles.author}>by {book.author}</p>
                                <span className={styles.libTag}>📍 {library.name}</span>
                            </div>
                        </div>

                        <div className={styles.content}>
                            <div className={styles.availabilityRow}>
                                <span className={book.availableCopies > 0 ? styles.inStock : styles.outStock}>
                                    {book.availableCopies > 0 ? `🟢 ${book.availableCopies} Copies Available` : "🔴 Out of Stock"}
                                </span>
                            </div>

                            <div className={styles.pricingSection}>
                                <div className={styles.priceBox}>
                                    <span className={styles.priceLabel}>RENTAL</span>
                                    <span className={styles.priceValue}>₹{book.rentPrice}</span>
                                    <span className={styles.period}>/ 5 Days</span>
                                </div>
                                <div className={styles.priceBox}>
                                    <span className={styles.priceLabel}>PURCHASE</span>
                                    <span className={styles.priceValue}>₹{book.buyPrice}</span>
                                    <span className={styles.period}>Owned Forever</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button 
                                className={styles.primaryBtn}
                                onClick={() => setStep(2)}
                                disabled={book.availableCopies === 0}
                                style={{ width: "100%", flex: 1 }}
                            >
                                ⚡ Rent or Buy Now
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.choiceStep}>
                        <h3>Select Transaction Type</h3>
                        <p className={styles.choiceSub}>Institutional books have fixed rates set by {library.name}.</p>
                        
                        {error && <p className={styles.error}>{error}</p>}

                        <div className={styles.choiceList}>
                            <div 
                                className={styles.choiceCard} 
                                onClick={() => handleAction("rent")}
                            >
                                <div className={styles.choiceText}>
                                    <strong>Rent for 5 Days</strong>
                                    <span>Return by {new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString()}</span>
                                </div>
                                <span className={styles.choicePrice}>₹{book.rentPrice}</span>
                            </div>

                            <div 
                                className={styles.choiceCard}
                                onClick={() => handleAction("buy")}
                            >
                                <div className={styles.choiceText}>
                                    <strong>Buy Permanently</strong>
                                    <span>Added to your digital library</span>
                                </div>
                                <span className={styles.choicePrice}>₹{book.buyPrice}</span>
                            </div>
                        </div>

                        <button 
                            className={styles.backBtn}
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            ← Back to Details
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryBookDetailModal;
