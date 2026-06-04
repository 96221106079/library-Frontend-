import { useState, useEffect } from 'react';
import { requestAPI, reviewAPI } from '../../services/api';
import { Rating } from '../UI/CoreComponents';
import './BookDetailsPanel.css';

const BookDetailsPanel = ({ book, onActionComplete, onClose }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (book?._id || book?.id) {
      fetchReviews();
      setActiveTab('details');
      setImgError(false);
    }
  }, [book?._id, book?.id]);

  const fetchReviews = async () => {
    try {
      const bookId = book._id || book.id;
      if (!bookId) return;
      const res = await reviewAPI.getByBook(bookId);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleBuy = async () => {
    if (!currentUser.id) return alert('Please login to buy books');
    if (!window.confirm(`Are you sure you want to request to buy "${book.title}" for ₹${book.buyPrice}?`)) return;
    try {
      setLoading(true);
      const bookId = book._id || book.id;
      const res = await requestAPI.buy(bookId, 'buy');
      if (res.data.success) {
        alert(`📬 Purchase request sent!`);
        onActionComplete?.();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRent = async () => {
    if (!currentUser.id) return alert('Please login to rent books');
    if (!window.confirm(`Are you sure you want to request to rent "${book.title}" for ₹${book.rentPrice}?`)) return;
    try {
      setLoading(true);
      const bookId = book._id || book.id;
      const res = await requestAPI.buy(bookId, 'rent');
      if (res.data.success) {
        alert('✅ Rent request sent!');
        onActionComplete?.();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rent request failed');
    } finally {
      setLoading(false);
    }
  };

  if (!book) {
    return null;
  }

  const isOwner = currentUser.id === (book.ownerId?._id || book.ownerId);
  const isBorrower = currentUser.id === book.borrower;
  
  const displayBuy = book.availableForBuy === true;
  const displayRent = book.availableForRent === true;
  const isAvail = book.status === 'available' || !book.status;

  const isValidPrice = (val) => {
    if (val === undefined || val === null || val === '' || val === 0 || val === '0') return false;
    if (Number.isNaN(Number(val))) return false;
    return true;
  };

  const buyPriceValid = isValidPrice(book.buyPrice);
  const rentPriceValid = isValidPrice(book.rentPrice);

  return (
    <aside className="details-panel-container">
      {/* Mobile Close Button - Only visible if we style it as a modal on mobile */}
      {onClose && (
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.15)', color: '#B8C0FF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
        >
          ✕
        </button>
      )}

      <div className="panel-cover-wrapper">
        {!imgError && book.image ? (
          <img
            src={book.image}
            alt={book.title}
            className="panel-cover-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="panel-cover-fallback">📚</div>
        )}
      </div>

      <h2 className="panel-title">{book.title}</h2>
      <p className="panel-author">by {book.author}</p>

      <div className="panel-meta-row">
        {book.category && (
          <span className="panel-tag">{book.category}</span>
        )}
        <span className={`panel-status ${isAvail ? 'available' : 'unavailable'}`}>
          {isAvail ? 'AVAILABLE' : (book.status || 'UNAVAILABLE').toUpperCase()}
        </span>
      </div>

      {/* Tabs */}
      <div className="panel-tabs-header">
        <button 
          className={`panel-tab-btn ${activeTab === 'details' ? 'active' : ''}`} 
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={`panel-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      <div className="panel-tab-content">
        {activeTab === 'details' && (
          <p style={{ margin: 0 }}>
            {book.description || 'No description available for this book.'}
          </p>
        )}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(124,77,255,0.06)'}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Rating value={r.rating} readOnly size="sm" />
                    <span style={{ fontSize: 11, color: '#7D86B2' }}>{r.user?.name || 'Anonymous'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12 }}>{r.text}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#7D86B2' }}>No reviews yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Prices */}
      <div className="panel-prices-section">
        <div className="panel-price-card">
          <span className="panel-price-label">Buy Price</span>
          {displayBuy ? (
            buyPriceValid ? (
              <span className="panel-price-val buy">₹{book.buyPrice}</span>
            ) : (
              <span className="panel-price-na">Buy Not Available</span>
            )
          ) : (
            <span className="panel-price-na">Not for sale</span>
          )}
        </div>
        
        <div className="panel-price-card">
          <span className="panel-price-label">Rent Price</span>
          {displayRent ? (
            rentPriceValid ? (
              <>
                <span className="panel-price-val rent">₹{book.rentPrice}</span>
                <span className="panel-price-duration">/ {book.rentDuration || 7} Days</span>
              </>
            ) : (
              <span className="panel-price-na">Rent Not Available</span>
            )
          ) : (
            <span className="panel-price-na">Not for rent</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isOwner && !isBorrower && isAvail && (
        <div className="panel-action-buttons">
          {displayBuy && buyPriceValid && (
            <button className="btn-panel-buy" onClick={handleBuy} disabled={loading}>
              BUY NOW
            </button>
          )}
          {displayRent && rentPriceValid && (
            <button className="btn-panel-rent" onClick={handleRent} disabled={loading}>
              RENT NOW
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default BookDetailsPanel;
