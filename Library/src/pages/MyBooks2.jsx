import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { EmptyState, Skeleton } from '../components/UI/CoreComponents';

// ─── Status badge helper ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    available:  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: '✅ Available' },
    requested:  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: '⏳ Requested' },
    borrowed:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: '📦 Borrowed' },
    rented:     { bg: 'rgba(139,92,246,0.15)',  color: '#c084fc', label: '🔑 Rented' },
    sold:       { bg: 'rgba(100,116,139,0.15)', color: '#64748b', label: '✔ Sold' },
  };
  const s = map[status] || { bg: 'rgba(100,116,139,0.15)', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>{s.label}</span>
  );
};

// ─── Edit Book Modal ─────────────────────────────────────────────────────────
const EditBookModal = ({ book, onClose, onSaved }) => {
  const CATEGORIES = ['Education','Technology','Fiction','Non-Fiction','Biography','Science','History','Business','Health'];
  const [form, setForm] = useState({
    title:      book.title      || '',
    author:     book.author     || '',
    category:   book.category   || 'Fiction',
    buyPrice:   book.buyPrice   || '',
    rentPrice:  book.rentPrice  || '',
    rentDuration: book.rentDuration || 7,
    image:      book.image      || '',
    availableForRent: book.availableForRent ?? false,
    availableForBuy:  book.availableForBuy  ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      return setError('Title and Author are required.');
    }
    setSaving(true);
    setError('');
    try {
      const res = await booksAPI.update(book._id, {
        title:      form.title.trim(),
        author:     form.author.trim(),
        category:   form.category,
        buyPrice:   form.buyPrice !== "" ? Number(form.buyPrice) : null,
        rentPrice:  form.rentPrice !== "" ? Number(form.rentPrice) : null,
        rentDuration: form.rentDuration !== "" ? Number(form.rentDuration) : 7,
        image:      form.image.trim() || undefined,
        availableForRent: form.availableForRent,
        availableForBuy:  form.availableForBuy,
      });
      if (res.data.success) {
        onSaved();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Input helper ─────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(148,163,184,0.15)',
    background: '#f8fafc',
    color: '#0f172a', fontSize: '14px', outline: 'none',
    transition: 'border-color 200ms',
    boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', color: '#64748b', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9000, padding: '16px',
    }}>
      <div style={{
        background: 'rgba(18,28,48,0.98)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '24px',
        padding: '28px',
        width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>✏️ Edit Book</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Update your book's details</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0, 0, 0, 0.05)', border: 'none',
            width: '36px', height: '36px', borderRadius: '10px',
            color: '#64748b', cursor: 'pointer', fontSize: '18px',
          }}>✕</button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', padding: '10px 14px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '18px',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Book title" />
          </div>

          {/* Author */}
          <div>
            <label style={labelStyle}>Author *</label>
            <input style={inputStyle} value={form.author} onChange={e => set('author', e.target.value)} placeholder="Author name" />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Buy Price (₹)</label>
              <input style={inputStyle} type="number" min="0" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Rent Price (₹/day)</label>
              <input style={inputStyle} type="number" min="0" value={form.rentPrice} onChange={e => set('rentPrice', e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Rent Duration */}
          <div>
            <label style={labelStyle}>Rent Duration (days)</label>
            <input style={inputStyle} type="number" min="1" value={form.rentDuration} onChange={e => set('rentDuration', e.target.value)} placeholder="7" />
          </div>

          {/* Image URL */}
          <div>
            <label style={labelStyle}>Cover Image URL</label>
            <input style={inputStyle} value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://..." />
            {form.image && (
              <img src={form.image} alt="preview"
                onError={e => e.target.style.display = 'none'}
                style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }}
              />
            )}
          </div>

          {/* Availability Toggles */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { key: 'availableForBuy',  label: '🛒 Available to Buy'  },
              { key: 'availableForRent', label: '🔑 Available to Rent' },
            ].map(({ key, label }) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: form[key] ? 'rgba(99,102,241,0.1)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${form[key] ? 'rgba(99,102,241,0.3)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '10px', padding: '10px 14px',
                cursor: 'pointer', flex: 1, transition: 'all 200ms',
              }}>
                <input
                  type="checkbox" checked={form[key]}
                  onChange={e => set(key, e.target.checked)}
                  style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                />
                <span style={{ color: form[key] ? '#a5b4fc' : '#64748b', fontSize: '13px', fontWeight: '600' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '12px',
            background: 'rgba(0, 0, 0, 0.04)', color: '#64748b',
            border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer',
            fontWeight: '700', fontSize: '14px',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '12px', borderRadius: '12px',
            background: saving ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#0f172a', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '800', fontSize: '14px',
            boxShadow: saving ? 'none' : '0 6px 20px rgba(99,102,241,0.35)',
          }}>{saving ? 'Saving...' : '✅ Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const MyBooksPage = () => {
  const navigate = useNavigate();
  const [myBooks, setMyBooks]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [deletingId, setDeletingId]     = useState(null);
  const [expandedBook, setExpandedBook] = useState(null);
  const [editingBook, setEditingBook]   = useState(null);   // book being edited

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await fetchMyBooks();
    setLoading(false);
  };

  const fetchMyBooks = async () => {
    try {
      const res = await booksAPI.getMyBooks();
      if (res.data.success) setMyBooks(res.data.books || []);
    } catch (err) { console.error('fetchMyBooks:', err); }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Delete this book? This cannot be undone.')) return;
    try {
      setDeletingId(bookId);
      const res = await booksAPI.delete(bookId);
      if (res.data.success) setMyBooks(b => b.filter(x => x._id !== bookId));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally { setDeletingId(null); }
  };

  // ── Book Card ───────────────────────────────────────────────────────────────
  const BookCard = ({ book }) => {
    const isExpanded = expandedBook === book._id;
    return (
      <div style={{
        background: 'rgba(18,28,48,0.7)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: '18px', overflow: 'hidden', marginBottom: '14px',
        transition: 'border-color 200ms, box-shadow 200ms',
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Header row — click to expand */}
        <div
          onClick={() => setExpandedBook(isExpanded ? null : book._id)}
          style={{ padding: '16px', display: 'flex', gap: '14px', cursor: 'pointer', alignItems: 'center' }}
        >
          <img
            src={book.image}
            alt={book.title}
            onError={e => e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80'}
            style={{ width: '64px', height: '86px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: '0 0 3px', color: '#0f172a', fontSize: '15px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {book.title}
            </h4>
            <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px' }}>by {book.author}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge status={book.status} />
              {book.buyPrice  > 0 && <span style={{ background: 'rgba(16,185,129,0.1)',  color: '#10b981', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>₹{book.buyPrice} BUY</span>}
              {book.rentPrice > 0 && <span style={{ background: 'rgba(245,158,11,0.1)',  color: '#fbbf24', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>₹{book.rentPrice}/day RENT</span>}
              <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                {book.timesBorrowed || 0} borrows
              </span>
            </div>
          </div>
          <span style={{ color: '#334155', fontSize: '13px', flexShrink: 0, transition: 'transform 200ms', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>

        {/* Expanded panel */}
        {isExpanded && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Times Borrowed', value: book.timesBorrowed || 0,              color: '#6366f1' },
                { label: 'Rating',         value: book.averageRating?.toFixed(1) || '—', color: '#10b981' },
                { label: 'Status',         value: book.status?.toUpperCase(),            color: '#f59e0b' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                  <p style={{ margin: 0, color: stat.color, fontSize: '16px', fontWeight: '900' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Edit */}
              <button
                onClick={() => setEditingBook(book)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', fontWeight: '700',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#6366f1',
                  border: '1px solid rgba(99,102,241,0.25)',
                  cursor: 'pointer', fontSize: '13px',
                  transition: 'all 200ms',
                }}
              >✏️ Edit Book</button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(book._id)}
                disabled={deletingId === book._id}
                style={{
                  flex: 1, padding: '11px', borderRadius: '10px', fontWeight: '700',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                  cursor: deletingId === book._id ? 'not-allowed' : 'pointer',
                  fontSize: '13px', opacity: deletingId === book._id ? 0.6 : 1,
                }}
              >{deletingId === book._id ? 'Deleting...' : '🗑️ Delete'}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 32px', width: '100%', paddingBottom: '80px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.03em' }}>📚 My Books</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Manage your collection • {myBooks.length} book{myBooks.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/add-book')}
          style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#0f172a', padding: '10px 20px', borderRadius: '12px',
            border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
          }}
        >+ Add Book</button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.04)', marginBottom: '20px' }} />

      {/* Content */}
      {loading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ marginBottom: '14px' }}><Skeleton width="100%" height="120px" /></div>
          ))}
        </div>
      ) : (
        myBooks.length > 0 ? (
          myBooks.map(book => <BookCard key={book._id} book={book} />)
        ) : (
          <EmptyState
            icon="📚" title="No books yet"
            description="Start by adding your first book to the marketplace!"
            action={{ label: '+ Add Book', action: () => navigate('/add-book') }}
          />
        )
      )}

      {/* Edit Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSaved={fetchMyBooks}
        />
      )}
    </div>
  );
};

export default MyBooksPage;
