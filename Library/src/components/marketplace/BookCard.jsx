import { useState } from "react";
import ReviewModal from "./ReviewModal";
import { transactionAPI, libraryAPI } from "../../services/api";

const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const BookCard = ({ book, onRefresh, onBuy, onRent }) => {
  const [imgError, setImgError] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?._id || currentUser?.id;

  const bookOwnerId = book.ownerId?._id || book.ownerId || book.owner?._id || book.owner;
  const isOwner = currentUserId && String(bookOwnerId) === String(currentUserId);
  const isAvailable = book.status === "available" || book.status === "AVAILABLE";

  const fallbackColors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6", "#ec4899"];
  const idStr = String(book.id || book._id || "0");
  const fallbackColor = fallbackColors[idStr.length % fallbackColors.length];

  const statusColors = {
    available: '#10b981',
    requested: '#f59e0b',
    taken: '#64748b',
    borrowed: '#6366f1'
  };
  const currentStatusColor = statusColors[book.status?.toLowerCase()] || statusColors.available;

  const cardStyle = {
    background: '#111b3d',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05), 0 0 10px rgba(99, 102, 241, 0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };

  return (
    <>
      <div 
        style={cardStyle} 
        onClick={() => setShowReviews(true)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '130%', background: '#0f172a' }}>
          {!imgError ? (
            <img
              src={book.image}
              alt={book.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: fallbackColor }}>
              <span style={{ fontSize: '32px' }}>📚</span>
            </div>
          )}

          <div style={{
            position: 'absolute', top: '12px', left: '12px', background: 'rgba(16, 185, 129, 0.9)',
            backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '4px 10px',
            fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px'
          }}>
            {isAvailable ? "AVAILABLE" : book.status?.toUpperCase()}
          </div>

          {isOwner && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px', background: 'rgba(99, 102, 241, 0.9)',
              color: '#0f172a', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px'
            }}>YOURS</div>
          )}
        </div>

        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {book.title}
            </h4>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>by {book.author}</p>
            {book.category && (
              <span style={{ fontSize: '11px', background: 'rgba(0, 0, 0, 0.06)', color: '#334155', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', fontWeight: '600' }}>
                {book.category}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: 'auto 0 4px 0' }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {book.buyPrice != null && (
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>
                  {book.rentPrice == null ? `₹${book.buyPrice}` : `Buy ₹${book.buyPrice}`}
                </span>
              )}
              {book.rentPrice != null && (
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  Rent ₹{book.rentPrice} / {book.rentDuration || 7} Days
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPinIcon />
              {book.distanceKm ? `${book.distanceKm.toFixed(1)}km` : "Nearby"}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isOwner ? (
              <button style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: 'rgba(0, 0, 0, 0.04)', color: '#64748b', fontSize: '13px',
                fontWeight: '700', cursor: 'default'
              }} disabled>
                My Listing
              </button>
            ) : isAvailable ? (
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                {book.buyPrice != null && (
                  <button
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
                      background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                      fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBuy) onBuy(book);
                    }}
                  >
                    BUY
                  </button>
                )}
                {book.rentPrice != null && (
                  <button
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
                      background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
                      fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = '#818cf8'; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRent) onRent(book);
                    }}
                  >
                    RENT
                  </button>
                )}
              </div>
            ) : (
              <button style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: 'rgba(0, 0, 0, 0.04)', color: '#64748b', fontSize: '13px',
                fontWeight: '700', cursor: 'default'
              }} disabled>
                {book.status === "requested" || book.status === "REQUESTED" ? "Requested" : "Taken"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReviews && (
        <ReviewModal
          book={book}
          onClose={() => setShowReviews(false)}
        />
      )}
    </>
  );
};

export default BookCard;
