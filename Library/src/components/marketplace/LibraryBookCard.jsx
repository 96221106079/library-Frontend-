import { useState } from "react";
import styles from "./BookCard.module.css";

const LibraryBookCard = ({ book, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  const fallbackColors = ["#8b1874", "#be185d", "#c026d3", "#9d174d"];
  const fallbackColor = fallbackColors[String(book._id).length % fallbackColors.length];

  return (
    <div className={styles.card} onClick={() => onSelect(book)}>
      <div className={styles.imageWrapper}>
        {!imgError && book.image ? (
          <img
            src={book.image}
            alt={book.title}
            className={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.imageFallback} style={{ background: fallbackColor }}>
            <span className={styles.fallbackEmoji}>🏛️</span>
          </div>
        )}
        <div className={`${styles.categoryBadge} ${book.availableCopies > 0 ? styles.available : styles.oos}`}>
            {book.availableCopies > 0 ? "🟢 Available" : "🔴 Out of Stock"}
        </div>
      </div>

      <div className={styles.info}>
        <h4 className={styles.title}>{book.title}</h4>
        <p className={styles.author}>by {book.author}</p>
        
        <div className={styles.libraryMeta}>
           <div className={styles.stockInfo}>
              {book.availableCopies} copies left
           </div>
           <div className={styles.pricingRow}>
              <span className={styles.rentPrice}>Rent: ₹{book.rentPrice}</span>
              <span className={styles.buyPrice}>Buy: ₹{book.buyPrice}</span>
           </div>
        </div>

        <button 
           className={styles.viewBtn}
           onClick={(e) => { e.stopPropagation(); onSelect(book); }}
        >
           View Details
        </button>
      </div>
    </div>
  );
};

export default LibraryBookCard;
