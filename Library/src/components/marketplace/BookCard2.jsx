import { useState } from 'react';
import BookDetailModal from './BookDetailModal';

// Status config
const STATUS_CONFIG = {
  available: { color: '#34d399', dot: '#10b981' },
  requested: { color: '#fbbf24', dot: '#f59e0b' },
  borrowed: { color: '#60a5fa', dot: '#3b82f6' },
  rented: { color: '#c084fc', dot: '#8b5cf6' },
  sold: { color: '#94a3b8', dot: '#64748b' },
};

const FALLBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#ec4899'];

const StarIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? '#fbbf24' : 'rgba(148,163,184,0.2)'}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const BookCard2 = ({ book, onRefresh }) => {
  console.log(`BookCard2 [${book?.title}]:`, { buyPrice: book?.buyPrice, rentPrice: book?.rentPrice, availableForBuy: book?.availableForBuy, availableForRent: book?.availableForRent });
  const [imgError, setImgError] = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [initialAction, setInitialAction] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = String(currentUser.id || currentUser._id || '');
  const bookOwnerId = String(
    book.owner?._id || book.owner ||
    book.ownerId?._id || book.ownerId || ''
  );
  const isOwner = currentUserId && currentUserId === bookOwnerId;

  const idStr = String(book._id || book.id || '0');
  const fallbackBg = FALLBACK_COLORS[idStr.length % FALLBACK_COLORS.length];
  const avgRating = book.averageRating || 0;
  const statusKey = (book.status || 'available').toLowerCase();
  const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;
  const distLabel = book.distanceLabel || (book.distanceKm != null ? `${book.distanceKm.toFixed(1)} km` : null);

  const openWithAction = (e, action) => {
    e.stopPropagation();
    setInitialAction(action);
    setShowDetail(true);
  };

  const handleCardClick = () => {
    if (!isOwner) {
      setInitialAction(null);
      setShowDetail(true);
    }
  };

  const cardStyle = {
    background: '#111b3d',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 10px rgba(99, 102, 241, 0.1)',
    overflow: 'hidden',
    cursor: isOwner ? 'default' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        style={cardStyle}
        onMouseEnter={(e) => !isOwner && (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseLeave={(e) => !isOwner && (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {/* ── Image ───────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '130%', background: '#0f172a' }}>
          {!imgError ? (
            <img
              src={book.image}
              alt={book.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                background: `linear-gradient(135deg, ${fallbackBg}33, ${fallbackBg}66)`
              }}
            >
              📚
            </div>
          )}

          {/* Status badge */}
          <div style={{
            position: 'absolute', top: '12px', left: '12px', background: 'rgba(16, 185, 129, 0.9)',
            backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '4px 10px',
            fontSize: '11px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px'
          }}>
            {statusKey.toUpperCase()}
          </div>

          {/* "Your Book" badge */}
          {isOwner && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px', background: 'rgba(99, 102, 241, 0.9)',
              color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px'
            }}>YOURS</div>
          )}
        </div>

        {/* ── Body ────────────────────────────── */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={book.title}>
              {book.title}
            </h4>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#94a3b8' }}>{book.author}</p>
            {book.category && (
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', fontWeight: '600' }}>
                {book.category}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: 'auto 0 4px 0' }}>
            {book.buyPrice != null && (
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>
                {book.rentPrice == null ? `₹${book.buyPrice}` : `Buy ₹${book.buyPrice}`}
              </span>
            )}
            {book.rentPrice != null && (
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>
                Rent ₹{book.rentPrice} / {book.rentDuration || 7} Days
              </span>
            )}
          </div>

          {!isOwner && (book.status === 'available' || !book.status) && (() => {
            if (book.buyPrice == null && book.rentPrice == null) return null;
            return (
              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
                {book.buyPrice != null && (
                  <button
                    style={{
                      flex: '1', padding: '10px 4px', borderRadius: '10px', border: 'none',
                      background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                      fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; }}
                    onClick={(e) => openWithAction(e, 'buy')}
                    title="Buy this book"
                  >BUY</button>
                )}
                {book.rentPrice != null && (
                  <button
                    style={{
                      flex: '1', padding: '10px 4px', borderRadius: '10px', border: 'none',
                      background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
                      fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = '#818cf8'; }}
                    onClick={(e) => openWithAction(e, 'rent')}
                    title="Rent this book"
                  >RENT</button>
                )}
              </div>
            );
          })()}

          {isOwner && (
            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              <span>📊</span> Listed in your collection
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <BookDetailModal
          book={book}
          initialAction={initialAction}
          onClose={() => { setShowDetail(false); setInitialAction(null); }}
          onActionComplete={() => {
            setShowDetail(false);
            setInitialAction(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

export default BookCard2;
