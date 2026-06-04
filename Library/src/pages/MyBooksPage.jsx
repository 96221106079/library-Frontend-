import { useState, useEffect } from "react";
import { booksAPI } from "../services/api";
import BorrowRentModal from "../components/marketplace/BorrowRentModal";
import styles from "./MyBooksPage.module.css";
import Toast from "../components/Toast";

const StarRating = ({ rating, interactive = false, onRate }) => {
  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${styles.star} ${star <= rating ? styles.starFilled : ""}`}
          onClick={() => interactive && onRate && onRate(star)}
          style={{ cursor: interactive ? "pointer" : "default" }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const BookCardDetailed = ({ book, onUpdate, showToast, onUpdateModal }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [reviewText, setReviewText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [myRating, setMyRating] = useState(
    book.ratings?.find((r) => r.user === user?.id)?.rating || 0
  );

  const isAvailable = book.status === "available";
  const isOwner = String(book.owner?._id || book.owner) === String(user?.id);

  const handleRate = async (val) => {
    try {
      setMyRating(val);
      await booksAPI.rateBook(book._id, val);
      onUpdate();
    } catch (err) {
      showToast("Failed to submit rating", "error");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    try {
      await booksAPI.addReview(book._id, reviewText);
      setReviewText("");
      onUpdate();
    } catch (err) {
      showToast("Failed to post review", "error");
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!commentText.trim()) return;
      try {
        await booksAPI.addComment(book._id, commentText);
        setCommentText("");
        onUpdate();
      } catch (err) {
        showToast("Failed to post comment", "error");
      }
    }
  };

  return (
    <div className={styles.bookCard}>
      {/* Top Header / Image Area */}
      <div className={styles.cardHeader}>
        <div className={styles.imgContainer}>
          <img src={book.image} alt={book.title} className={styles.bookImage} />
        </div>
        <div className={styles.bookInfo}>
          <h2 className={styles.bookTitle}>{book.title}</h2>
          <p className={styles.bookAuthor}>by {book.author}</p>
          <div className={styles.bookPrice} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {book.buyPrice > 0 && (
              <span style={{ fontSize: "14px", color: "#10b981", fontWeight: "700" }}>Buy: ₹{book.buyPrice}</span>
            )}
            {book.rentPrice > 0 && (
              <span style={{ fontSize: "14px", color: "#6366f1", fontWeight: "700" }}>Rent: ₹{book.rentPrice}/wk</span>
            )}
            {!(book.buyPrice > 0) && !(book.rentPrice > 0) && (
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>₹{book.buyPrice || "Price Not Available"}</span>
            )}
          </div>
          <div className={`${styles.statusBadge} ${styles[book.status] || styles.defaultStatus}`}>
            {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
          </div>
          <div className={styles.ratingInfo}>
            <StarRating rating={Math.round(book.averageRating || 0)} />
            <span className={styles.avgText}>{book.averageRating ? book.averageRating.toFixed(1) : "No ratings"}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsBox}>
        {isOwner ? (
          <div className={styles.ownerBadge}>📌 This is your book</div>
        ) : (
          <>
            <button
              className={`${styles.actionBtn} ${styles.borrowBtn}`}
              onClick={() => onUpdateModal(book, "borrow")}
              disabled={!isAvailable}
            >
              📘 Borrow
            </button>
            <button
              className={`${styles.actionBtn} ${styles.rentBtn}`}
              onClick={() => onUpdateModal(book, "rent")}
              disabled={!isAvailable}
            >
              💰 Rent
            </button>
          </>
        )}
      </div>

      <div className={styles.divider} />

      {/* Interaction Sections */}
      <div className={styles.interactionsBox}>
        {/* Rating Section */}
        <div className={styles.rateSection}>
          <p className={styles.sectionTitle}>Rate this book:</p>
          <StarRating rating={myRating} interactive={true} onRate={handleRate} />
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewSection}>
          <p className={styles.sectionTitle}>Reviews ({book.reviews?.length || 0})</p>
          <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
            <textarea
              className={styles.reviewInput}
              placeholder="Write a review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={2}
            />
            <button type="submit" className={styles.submitBtn}>Post Review</button>
          </form>
          <div className={styles.reviewList}>
            {book.reviews?.map((rev, idx) => (
              <div key={idx} className={styles.reviewItem}>
                <strong>{rev.user?.username || "A Reader"}:</strong> {rev.text}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.dividerSm} />

        {/* Comments Section */}
        <div className={styles.commentSection}>
          <p className={styles.sectionTitle}>Discussion & Comments</p>
          <div className={styles.commentList}>
            {book.comments?.map((c, idx) => (
              <div key={idx} className={styles.commentItem}>
                <span className={styles.commentUser}>💬 {c.user?.username || "User"}</span>
                <span className={styles.commentMsg}>: {c.message}</span>
                <span className={styles.commentTime}>
                  {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <input
            type="text"
            className={styles.commentInput}
            placeholder="Write a comment and press Enter..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleCommentSubmit}
          />
        </div>
      </div>
    </div>
  );
};

const MyBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, book: null, type: "" });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await booksAPI.getAll(); // Assuming they want all available library books here or my available books
      if (res.data.success) {
        setBooks(res.data.books);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  return (
    <div className={styles.pageContainer}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className={styles.pageHeader}>
        <h1>📚 My Interactive Library</h1>
        <p>Borrow, Rent, Rate and Review seamlessly.</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading your books...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : books.length === 0 ? (
        <div className={styles.emptyState}>No books available right now.</div>
      ) : (
        <div className={styles.cardLayout}>
          {books.map(book => (
            <BookCardDetailed 
              key={book._id} 
              book={book} 
              onUpdate={fetchBooks} 
              showToast={showToast} 
              onUpdateModal={(b, t) => setModal({ isOpen: true, book: b, type: t })}
            />
          ))}
        </div>
      )}

      {/* MODAL (Unified tracking and verification) */}
      <BorrowRentModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, book: null, type: "" })}
        book={modal.book}
        type={modal.type}
        onSuccess={fetchBooks}
      />
      
      <div style={{ height: "60px" }} />
    </div>
  );
};

export default MyBooksPage;
