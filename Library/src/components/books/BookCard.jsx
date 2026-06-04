import { useState } from 'react';
import './BookCard.css';

const BookCard = ({ book, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const isOwner = currentUser.id === (book.ownerId?._id || book.ownerId);
  const isBorrower = currentUser.id === book.borrower;
  
  const displayBuy = book.availableForBuy === true;
  const displayRent = book.availableForRent === true;

  const isValidPrice = (val) => {
    if (val === undefined || val === null || val === '' || val === 0 || val === '0') return false;
    if (Number.isNaN(Number(val))) return false;
    return true;
  };

  const buyPriceValid = isValidPrice(book.buyPrice);
  const rentPriceValid = isValidPrice(book.rentPrice);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(book);
    }
  };

  return (
    <div 
      className={`book-card-container ${isOwner ? 'is-owner-card' : ''}`}
      onClick={handleCardClick}
    >
      {/* Badges */}
      {(!book.status || book.status.toLowerCase() === 'available') ? (
        <span className="book-card-badge-available">AVAILABLE</span>
      ) : null}
      
      {isOwner && (
        <span className="book-card-badge-owner">Your Book</span>
      )}

      {/* Cover Image */}
      <div className="book-card-cover-wrapper">
        {!imgError && book.image ? (
          <img
            src={book.image}
            alt={book.title}
            className="book-card-cover-image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="book-card-cover-fallback">📚</div>
        )}
      </div>

      {/* Book Metadata */}
      <div className="book-card-info">
        <h3 className="book-card-title">{book.title}</h3>
        <p className="book-card-author">by {book.author}</p>
        
        {book.category && (
          <div className="book-card-category-wrapper">
            <span className="book-card-category">{book.category}</span>
          </div>
        )}
      </div>

      <div className="book-card-prices-container">
        {displayBuy && (
          buyPriceValid ? (
            <span className="book-card-price-buy">Buy ₹{book.buyPrice}</span>
          ) : (
            <span className="book-card-price-na">Buy Not Available</span>
          )
        )}
        
        {displayRent && (
          rentPriceValid ? (
            <span className="book-card-price-rent">Rent ₹{book.rentPrice}/{book.rentDuration || 7} Days</span>
          ) : (
            <span className="book-card-price-na">Rent Not Available</span>
          )
        )}

        {!displayBuy && !displayRent && (
          <span className="book-card-price-na">Not Available</span>
        )}
      </div>

      {book.distanceKm != null && (
        <div className="book-card-metadata">
          📍 {book.distanceKm < 1 ? 'Under 1km' : `${book.distanceKm.toFixed(1)} km`}
        </div>
      )}

      {/* Actions */}
      {!isOwner && !isBorrower && (!book.status || book.status.toLowerCase() === 'available') ? (
        <div className="book-card-buttons">
          {displayBuy && (
            <button className="btn-card-buy" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>BUY</button>
          )}
          {displayRent && (
            <button className="btn-card-rent" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>RENT</button>
          )}
        </div>
      ) : isOwner ? (
        <div className="book-card-owner-label">
          <span>📚 Part of your collection</span>
        </div>
      ) : isBorrower ? (
        <div className="book-card-owner-label">
          <span>📖 Currently reading</span>
        </div>
      ) : (
        <div className="book-card-owner-label" style={{ color: '#ef4444' }}>
          <span>Unavailable</span>
        </div>
      )}
    </div>
  );
};

export default BookCard;
