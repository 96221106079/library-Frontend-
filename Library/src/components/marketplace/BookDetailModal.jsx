import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI, requestAPI, cartAPI, reviewAPI, libraryAPI, transactionAPI } from '../../services/api';
import { Rating, Availability } from '../UI/CoreComponents';


const BookDetailModal = ({ book, onClose, onActionComplete, initialAction }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, text: '' });
  const [activeTab, setActiveTab] = useState('details');
  const [imgError, setImgError] = useState(false);
  const [action, setAction] = useState(initialAction || null); // pre-select if passed
  const [days, setDays] = useState(7);

  // Parse prices correctly from multiple potential backend fields
  const parsedBuyPrice = book?.buyPrice;
  const parsedRentPrice = book?.rentPrice;
  
  const hasBuyPrice = parsedBuyPrice !== undefined && parsedBuyPrice !== null && parsedBuyPrice > 0;
  const hasRentPrice = parsedRentPrice !== undefined && parsedRentPrice !== null && parsedRentPrice > 0;

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
      // Use requestAPI for unified request flow
      const res = await requestAPI.buy(bookId, 'buy');
      if (res.data.success) {
        alert(`📬 Purchase request sent! Purchased at rupee ${parsedBuyPrice}. The owner will confirm your order.`);
        onActionComplete?.();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser.id) return alert('Please login to use cart');

    try {
      setLoading(true);
      const bookId = book._id || book.id;
      const res = await cartAPI.add({ bookId, quantity: 1 });

      if (res.data.success) {
        onActionComplete?.();
        navigate('/cart');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add to cart. Make sure the book has a valid buy price.');
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

  console.log("Book Data:", book);

  const isOwner = currentUser.id === (book.ownerId?._id || book.ownerId);
  const isBorrower = currentUser.id === book.borrower;
  const avgRating = book.averageRating || 0;
  const distanceKm = book.distance ? book.distance.toFixed(1) : null;

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: '20px'
  };

  const modalStyle = {
    background: '#0f172a', width: '100%', maxWidth: '900px', maxHeight: '90vh',
    borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative', overflowY: 'auto', display: 'flex', flexDirection: 'column'
  };

  const closeBtnStyle = {
    position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)',
    border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%',
    cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
  };

  const contentContainerStyle = {
    display: 'flex', flexWrap: 'wrap', padding: '40px'
  };

  const leftColStyle = {
    flex: '1 1 340px', paddingRight: '40px'
  };

  const rightColStyle = {
    flex: '1 1 400px'
  };

  const tabStyle = (active) => ({
    padding: '10px 20px', border: 'none', background: 'transparent',
    color: active ? '#818cf8' : '#94a3b8', fontSize: '14px', fontWeight: '700',
    borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.2s'
  });

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <button style={closeBtnStyle} onClick={onClose}>✕</button>

        <div style={contentContainerStyle}>
          <div style={leftColStyle}>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              {!imgError ? (
                <img
                  src={book.image}
                  alt={book.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '2/3', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  <span>📚</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: '15px', left: '15px' }}>
                <Availability status={book.status} />
              </div>
            </div>

            {!isOwner && !isBorrower && (() => {
              const showBuy  = book.availableForBuy !== false;
              const showRent = book.availableForRent === true;
              const isAvail  = book.status === 'available' || !book.status;
              if (!showBuy && !showRent) return null;

              const badgeColor = !showBuy && showRent
                ? { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', text: '#a5b4fc', label: '🎯 Rent Only' }
                : showBuy && !showRent
                ? { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#6ee7b7', label: '🛍️ Purchase Only' }
                : { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', label: '🔀 Rent & Buy' };

              return (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '100%', padding: '7px 14px', borderRadius: '10px',
                    fontSize: '12px', fontWeight: '700', textAlign: 'center', letterSpacing: '0.05em',
                    background: badgeColor.bg, color: badgeColor.text,
                    border: `1px solid ${badgeColor.border}`,
                  }}>
                    {badgeColor.label}
                  </div>

                  {showBuy && (
                    <button
                      style={{ flex: '1 1 200px', padding: '12px', borderRadius: '12px', border: 'none',
                        background: isAvail ? 'linear-gradient(135deg,#10b981,#059669)' : '#1e293b',
                        color: '#fff', fontWeight: '700',
                        cursor: isAvail ? 'pointer' : 'not-allowed',
                        opacity: isAvail ? 1 : 0.5, transition: 'all 0.2s',
                        boxShadow: isAvail ? '0 4px 12px rgba(16,185,129,0.4)' : 'none',
                      }}
                      onClick={() => isAvail && setAction('buy')}
                      disabled={!isAvail}
                      title={isAvail ? 'Buy this book' : 'Book not available'}
                    >
                      🛍️ Buy Now
                    </button>
                  )}

                  {showRent && (
                    <button
                      style={{ flex: '1 1 110px', padding: '12px', borderRadius: '12px',
                        background: isAvail ? 'rgba(99,102,241,0.18)' : '#1e293b',
                        color: isAvail ? '#a5b4fc' : '#475569',
                        border: isAvail ? '1px solid rgba(99,102,241,0.5)' : '1px dashed #334155',
                        fontWeight: '700', cursor: isAvail ? 'pointer' : 'not-allowed',
                        opacity: isAvail ? 1 : 0.5, transition: 'all 0.2s',
                      }}
                      onClick={() => isAvail && setAction('rent')}
                      disabled={!isAvail}
                      title={isAvail ? 'Rent this book' : 'Book not available'}
                    >
                      🎯 Rent
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div style={rightColStyle}>
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '32px', margin: '0 0 8px', fontWeight: '800' }}>{book.title}</h1>
              <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 16px' }}>by {book.author}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '13px' }}>📂 {book.category}</span>
                {distanceKm && <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '13px' }}>📍 {distanceKm}km away</span>}
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
              <button style={tabStyle(activeTab === 'details')} onClick={() => setActiveTab('details')}>Details</button>
              <button style={tabStyle(activeTab === 'reviews')} onClick={() => setActiveTab('reviews')}>Reviews ({reviews.length})</button>
            </div>

            <div style={{ padding: '0 4px' }}>
              {activeTab === 'details' && (
                <div>
                  {book.ownerType === 'library' && (
                    <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '8px', fontSize: '13px', fontWeight: '700', marginBottom: '20px', display: 'inline-block' }}>📚 From Library</div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Buy Price */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>💰 Buy Price</label>
                      {book.availableForBuy && book.buyPrice != null ? (
                        <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#10b981' }}>₹{book.buyPrice}</p>
                      ) : (
                        <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#475569' }}>Not Available</p>
                      )}
                    </div>
                    {/* Rent Price */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>⏱️ Rent Price</label>
                      {book.availableForRent && book.rentPrice != null ? (
                        <>
                          <p style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#6366f1' }}>₹{book.rentPrice}<span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}> /day</span></p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Duration: {book.rentDuration || 7} days</p>
                        </>
                      ) : (
                        <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#475569' }}>Not Available</p>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic' }}>
                      {book.availableForBuy && book.availableForRent 
                        ? 'This book is available for purchase and rent.'
                        : book.availableForBuy 
                        ? 'This book is available for purchase.'
                        : book.availableForRent
                        ? 'This book is available for rent.'
                        : 'Availability information not provided.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {currentUser.id && !isOwner && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '15px' }}>Share Your Review</h4>
                      <Rating value={newReview.rating} onChange={r => setNewReview({ ...newReview, rating: r })} readOnly={false} size="md" />
                      <textarea
                        placeholder="Share your thoughts..."
                        value={newReview.text}
                        onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                        style={{ width: '100%', height: '80px', marginTop: '16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', padding: '12px', outline: 'none' }}
                      />
                      <button
                        style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        onClick={handleReviewSubmit}
                        disabled={loading || !newReview.rating}
                      >
                        {loading ? 'Posting...' : 'Post Review'}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.length > 0 ? reviews.map((r, i) => (
                      <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <Rating value={r.rating} readOnly size="sm" />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{r.user?.name || 'Anonymous'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5 }}>{r.text}</p>
                      </div>
                    )) : <p style={{ color: '#64748b', fontSize: '14px' }}>No reviews yet.</p>}
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>

        {action && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.95)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ maxWidth: '400px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{action === 'buy' ? 'Buy Book' : 'Rent Book'}</h3>
              <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 12px' }}>{book.title}</p>
              
              {action === 'buy' && (
                <>
                  <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>
                    Price: ₹{book.buyPrice}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '30px' }}>
                    Owner: {book.owner?.name || book.owner?.username || 'Owner'}
                  </p>
                </>
              )}
              
              {action === 'rent' && (
                <>
                  <p style={{ color: '#6366f1', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>
                    Rent Price: ₹{book.rentPrice} / {book.rentDuration || 7} Days
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '20px' }}>
                    Owner: {book.owner?.name || book.owner?.username || 'Owner'}
                  </p>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setAction(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button onClick={action === 'buy' ? handleBuy : handleRent} disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
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

export default BookDetailModal;
