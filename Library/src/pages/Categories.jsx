// ============================================
// Categories.jsx → My Books Page
// ============================================
import { useState, useEffect } from "react";
import { booksAPI } from "../services/api";
import ReviewModal from "../components/marketplace/ReviewModal";
import styles from "./Categories.module.css";



// ── Main Page ──────────────────────────────────────────────────────────────────
const Categories = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    booksAPI.getMyBooks()
      .then((res) => {
        if (res.data.success) setBooks(res.data.books);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor = {
    available: "#10b981",
    requested: "#f59e0b",
    borrowed: "#3b82f6",
    rented: "#8b5cf6",
    sold: "#ef4444",
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Books 📚</h1>
        <p className={styles.subtitle}>Your listed collection · Rate & review</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : books.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📖</span>
            <h3>No books listed yet</h3>
            <p>Start sharing books with your community!</p>
          </div>
        ) : (
          <div className={styles.bookGrid}>
            {books.map((book) => (
              <div key={book._id} className={styles.bookCard}>
                <div className={styles.bookImg}>
                  <img
                    src={book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400"}
                    alt={book.title}
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div className={styles.imgFallback} style={{ display: "none" }}>📚</div>
                </div>
                <div className={styles.bookBody}>
                  <div className={styles.bookMeta}>
                    <span
                      className={styles.statusBadge}
                      style={{ background: `${statusColor[book.status] || "#94a3b8"}20`, color: statusColor[book.status] || "#94a3b8" }}
                    >
                      {book.status}
                    </span>
                    <span className={styles.category}>{book.category}</span>
                  </div>
                  <h4 className={styles.bookTitle}>{book.title}</h4>
                  <p className={styles.bookAuthor}>by {book.author}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
                    {book.buyPrice > 0 && (
                      <span className={styles.bookPrice} style={{ fontSize: '12px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', color: '#10b981' }}>
                        Buy: ₹{book.buyPrice}
                      </span>
                    )}
                    {book.rentPrice > 0 && (
                      <span className={styles.bookPrice} style={{ fontSize: '12px', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px', color: '#6366f1' }}>
                        Rent: ₹{book.rentPrice}/day
                      </span>
                    )}
                    {!(book.buyPrice > 0 || book.rentPrice > 0) && (
                      <span className={styles.bookPrice} style={{ fontSize: '12px', color: '#64748b' }}>Price Not Available</span>
                    )}
                  </div>
                  <button
                    className={styles.reviewBtn}
                    onClick={() => setSelectedBook(book)}
                  >
                    ⭐ Rate & Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: "80px" }} />

      {selectedBook && (
        <ReviewModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSaved={() => { }}
        />
      )}
    </div>
  );
};

export default Categories;
