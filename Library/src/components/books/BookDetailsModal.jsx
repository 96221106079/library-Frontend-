import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAPI, reviewAPI } from '../../services/api';
import { Rating, Availability } from '../UI/CoreComponents';
import './BookDetailsModal.css';

const BookDetailsModal = ({ book, onClose, onActionComplete, initialAction }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, text: '' });
  const [activeTab, setActiveTab] = useState('details');
  const [imgError, setImgError] = useState(false);
  
  // Controls the confirmation overlay (null | 'buy' | 'rent')
  const [action, setAction] = useState(initialAction || null); 

  useEffect(() => {
    fetchReviews();
  }, [book?._id]);

  const fetchReviews = async () => {
    try {
      if (!book?._id) return;
      const res = await reviewAPI.getByBook(book._id);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleBuy = async () => {
    if (!currentUser.id) return alert('Please login to buy books');
    try {
      setLoading(true);
      const bookId = book._id || book.id;
      const res = await requestAPI.buy(bookId, 'buy');
      if (res.data.success) {
        alert(`📬 Purchase request sent! The owner will confirm your order.`);
        onActionComplete?.();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRent = async () => {
    if (!currentUser.id) return alert('Please login to rent books');
    try {
      setLoading(true);
      const bookId = book._id || book.id;
      const res = await requestAPI.buy(bookId, 'rent');
      if (res.data.success) {
        alert('✅ Rent request sent! The owner will be notified.');
        onActionComplete?.();
        setAction(null);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rent request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReview.rating || !newReview.text) return alert('Please fill all fields');
    try {
      setLoading(true);
      const res = await reviewAPI.add(book._id, {
        rating: newReview.rating,
        text: newReview.text,
      });
      if (res.data.success) {
        alert('✅ Review posted!');
        fetchReviews();
        setNewReview({ rating: 0, text: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post review');
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

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

  const getStatusClass = (status) => {
    return (status || 'available').toLowerCase() === 'available' ? 'status-available' : 'status-other';
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-body">
          {/* Left Side: Book Cover Image */}
          <div className="modal-left">
            <div className="modal-cover-wrapper">
              {!imgError && book.image ? (
                <img
                  src={book.image}
                  alt={book.title}
                  className="modal-cover-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="modal-cover-fallback">📚</div>
              )}
            </div>
          </div>

          {/* Right Side: Metadata and Actions */}
          <div className="modal-right">
            <h1 className="modal-title">{book.title}</h1>
            <p className="modal-author">by {book.author}</p>
            
            <div className="modal-tags-container">
              {book.category && (
                <span className="modal-tag">{book.category}</span>
              )}
              {book.distanceKm != null && (
                <span className="modal-tag">📍 {book.distanceKm < 1 ? 'Under 1km' : `${book.distanceKm.toFixed(1)} km`} away</span>
              )}
            </div>

            <div className="modal-status-container">
              <span className={`modal-status-badge ${getStatusClass(book.status)}`}>
                {book.status || 'AVAILABLE'}
              </span>
            </div>

            <div className="modal-prices-section">
              <div className="modal-price-card">
                <span className="price-label">💰 Buy Price</span>
                {displayBuy ? (
                  buyPriceValid ? (
                    <p className="price-value-buy">₹{book.buyPrice}</p>
                  ) : (
                    <p className="price-value-na">Not Available</p>
                  )
                ) : (
                  <p className="price-value-na">Not for sale</p>
                )}
              </div>
              
              <div className="modal-price-card">
                <span className="price-label">⏱️ Rent Price</span>
                {displayRent ? (
                  rentPriceValid ? (
                    <>
                      <p className="price-value-rent">₹{book.rentPrice}</p>
                      <p className="price-duration-label">for {book.rentDuration || 7} days</p>
                    </>
                  ) : (
                    <p className="price-value-na">Not Available</p>
                  )
                ) : (
                  <p className="price-value-na">Not for rent</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwner && !isBorrower && isAvail && (
              <div className="modal-action-buttons">
                {displayBuy && (
                  <button 
                    className="btn-modal-buy" 
                    onClick={() => setAction('buy')}
                    disabled={!buyPriceValid}
                  >
                    🛍️ Buy Now
                  </button>
                )}
                {displayRent && (
                  <button 
                    className="btn-modal-rent" 
                    onClick={() => setAction('rent')}
                    disabled={!rentPriceValid}
                  >
                    🎯 Rent Now
                  </button>
                )}
              </div>
            )}

            {/* Tabs Content */}
            <div className="modal-tabs-header">
              <button 
                className={`modal-tab-btn ${activeTab === 'details' ? 'active' : ''}`} 
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`modal-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} 
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            <div className="modal-tab-content">
              {activeTab === 'details' && (
                <div style={{ padding: '0 4px' }}>
                  {book.ownerType === 'library' && (
                    <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '8px', fontSize: '13px', fontWeight: '700', marginBottom: '16px', display: 'inline-block' }}>
                      📚 From Library Collection
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {book.description || 
                      (displayBuy && displayRent 
                        ? 'This book is available for both purchase and rent.'
                        : displayBuy 
                        ? 'This book is available exclusively for purchase.'
                        : displayRent
                        ? 'This book is available exclusively for rent.'
                        : 'Availability information not provided.')}
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ padding: '0 4px' }}>
                  {currentUser.id && !isOwner && (
                    <div className="review-form">
                      <h4>Share Your Review</h4>
                      <Rating value={newReview.rating} onChange={r => setNewReview({ ...newReview, rating: r })} readOnly={false} size="md" />
                      <textarea
                        className="review-textarea"
                        placeholder="Share your thoughts..."
                        value={newReview.text}
                        onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                      />
                      <button
                        className="btn-post-review"
                        onClick={handleReviewSubmit}
                        disabled={loading || !newReview.rating}
                      >
                        {loading ? 'Posting...' : 'Post Review'}
                      </button>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {reviews.length > 0 ? reviews.map((r, i) => (
                      <div key={i} className="review-item">
                        <div className="review-header">
                          <Rating value={r.rating} readOnly size="sm" />
                          <span className="review-user">{r.user?.name || 'Anonymous'}</span>
                        </div>
                        <p className="review-text">{r.text}</p>
                      </div>
                    )) : (
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No reviews yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Confirmation Overlay */}
        {action && (
          <div className="modal-confirm-overlay">
            <div className="confirm-card">
              <h3 className="confirm-title">{action === 'buy' ? 'Buy Book' : 'Rent Book'}</h3>
              <p className="confirm-book-title">{book.title}</p>
              
              {action === 'buy' && (
                <>
                  <p className="confirm-price-display buy">₹{book.buyPrice}</p>
                  <p className="confirm-owner">Owner: {book.owner?.name || book.owner?.username || 'Owner'}</p>
                </>
              )}
              
              {action === 'rent' && (
                <>
                  <p className="confirm-price-display rent">₹{book.rentPrice} <span style={{fontSize: '14px', color: '#94a3b8', fontWeight: 500}}>/ {book.rentDuration || 7} Days</span></p>
                  <p className="confirm-owner">Owner: {book.owner?.name || book.owner?.username || 'Owner'}</p>
                </>
              )}

              <div className="confirm-buttons">
                <button 
                  className="btn-confirm-cancel" 
                  onClick={() => setAction(null)}
                >
                  Cancel
                </button>
                <button 
                  className={`btn-confirm-action ${action}`}
                  onClick={action === 'buy' ? handleBuy : handleRent} 
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailsModal;
