import { useState, useEffect } from "react";
import { reviewAPI } from "../../services/api";
import styles from "./ReviewModal.module.css";

// ── Star Rating Component ──────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`${styles.star} ${star <= value ? styles.starFilled : ""}`}
        onClick={() => !readOnly && onChange && onChange(star)}
        style={{ cursor: readOnly ? "default" : "pointer" }}
      >
        ★
      </span>
    ))}
  </div>
);

const ReviewModal = ({ book, onClose, onSaved, onBorrow, onRent }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviews, setReviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [avgRating, setAvgRating] = useState(null);
  const [tab, setTab] = useState("read"); // Default to read tab for general viewers

  const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
  // Exact check for owner to show/hide write tab and show feedback chips
  const isOwner = book.ownerId?._id === userInfo.id || book.ownerId === userInfo.id || book.owner?._id === userInfo.id || book.owner === userInfo.id;

  useEffect(() => {
    if (book?._id) {
      reviewAPI.getByBook(book._id).then((res) => {
        if (res.data.success) {
          setReviews(res.data.reviews);
          setAvgRating(res.data.averageRating);
        }
      });
    }
  }, [book?._id]);

  const handleSave = async () => {
    if (!rating) return alert("Please select a rating.");
    setSaving(true);
    try {
      await reviewAPI.add(book._id, { rating, review, feedback });
      const res = await reviewAPI.getByBook(book._id);
      if (res.data.success) {
        setReviews(res.data.reviews);
        setAvgRating(res.data.averageRating);
      }
      setTab("read");
      onSaved?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save review.");
    } finally {
      setSaving(false);
    }
  };

  if (!book) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{book.title}</h3>
            <p className={styles.modalSub}>by {book.author}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {avgRating && (
          <div className={styles.avgRow}>
            <StarRating value={Math.round(avgRating)} readOnly />
            <span className={styles.avgLabel}>{avgRating} / 5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}

        {/* Action Buttons (Borrow / Rent) */}
        {!isOwner && (onBorrow || onRent) && (
          <div className={styles.actionContainer}>
            {onBorrow && (
              <button className={`${styles.actionBtn} ${styles.borrowBtn}`} onClick={onBorrow}>
                Borrow Book
              </button>
            )}
            {onRent && (
              <button className={`${styles.actionBtn} ${styles.rentBtn}`} onClick={onRent}>
                Rent Book
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={tab === "read" ? styles.activeTab : ""} onClick={() => setTab("read")}>All Reviews ({reviews.length})</button>
          {!isOwner && (
            <button className={tab === "write" ? styles.activeTab : ""} onClick={() => setTab("write")}>Write Review</button>
          )}
        </div>

        {/* Read Tab */}
        {tab === "read" && (
          <div className={styles.reviewList}>
            {reviews.length === 0 ? (
              <div className={styles.emptyReviews}>No reviews yet. Be the first!</div>
            ) : reviews.map((r) => (
              <div key={r._id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <div className={styles.reviewerAvatar}>
                    {r.userId?.name?.[0] || r.userId?.username?.[0] || "U"}
                  </div>
                  <div>
                    <p className={styles.reviewerName}>{r.userId?.name || r.userId?.username || "User"}</p>
                    <StarRating value={r.rating} readOnly />
                  </div>
                  <span className={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                {r.review && <p className={styles.reviewText}>{r.review}</p>}
                {r.feedback && isOwner && (
                  <div className={styles.feedbackChip}>💬 Feedback: {r.feedback}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Write Tab */}
        {tab === "write" && (
          <div className={styles.writeForm}>
            <label className={styles.label}>Your Rating</label>
            <StarRating value={rating} onChange={setRating} />

            <label className={styles.label}>Review</label>
            <textarea
              className={styles.textarea}
              placeholder="What did you think of this book?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              maxLength={500}
            />

            <label className={styles.label}>Feedback for Owner (Optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Condition, packaging, handover experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              maxLength={300}
            />

            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !rating}>
              {saving ? "Saving..." : "Submit Review ✓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
