// ============================================
// LibraryDetail.jsx - Institutional Collection
// ============================================
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { libraryAPI } from "../services/api";
import BookCard from "../components/marketplace/BookCard";
import styles from "./LibraryDetail.module.css";

const LibraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const res = await libraryAPI.getBooks(id);
        if (res.data.success) {
          setBooks(res.data.books);
        }
      } catch (err) {
        console.error("Failed to fetch library books:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [id]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Library Collection</h1>
        <p className={styles.subtitle}>{books.length} Books Available</p>
      </header>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.loading}>Scanning shelves...</div>
        ) : books.length === 0 ? (
          <div className={styles.empty}>This library collection is currently empty.</div>
        ) : (
          books.map(book => (
            <BookCard 
              key={book._id} 
              book={{
                ...book,
                id: book._id,
                ownerName: "Partner Library",
                distance: "Official Partner"
              }} 
              // Libraries might have different borrowing rules, but we use the same UI
              onBuy={() => alert("Libraries require in-person visit for verification.")}
              onRent={() => alert("Libraries require in-person visit for verification.")}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LibraryDetail;
