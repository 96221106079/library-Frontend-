import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { booksAPI } from '../services/api';
import { EmptyState, Skeleton } from '../components/UI/CoreComponents';
import BookGrid from '../components/books/BookGrid';
import BookDetailsPanel from '../components/books/BookDetailsPanel';
import './Home2.css';

const Home = () => {
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rightPanelElement, setRightPanelElement] = useState(null);

  useEffect(() => {
    // Wait for the layout to mount and find the portal target
    setRightPanelElement(document.getElementById('right-panel-root'));
  }, []);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const currentUserId = user?._id || user?.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const allRes = await booksAPI.getAll();
      if (allRes?.data?.success) {
        setAllBooks(allRes.data.books || []);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBooks = allBooks.filter(book => {
    const isAvailable = book.status === 'available';
    const bookOwnerId = book.ownerId?._id || book.ownerId || book.owner?._id || book.owner;
    const isNotMine = bookOwnerId !== currentUserId;
    const matchSearch =
      !search ||
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase());
    return isAvailable && isNotMine && matchSearch;
  });

  const handleSelect = (book) => {
    setSelectedBook(book);
    setMobileOpen(true);
  };

  const handleClosePanel = () => {
    setSelectedBook(null);
    setMobileOpen(false);
  };

  const SkeletonGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: '#ffffff', borderRadius: '24px', padding: '16px', height: '420px', border: '1px solid rgba(184, 192, 255, 0.1)' }}>
          <Skeleton width="100%" height="250px" style={{ borderRadius: '12px' }} />
          <Skeleton width="80%" height="20px" style={{ marginTop: '16px' }} />
          <Skeleton width="60%" height="16px" style={{ marginTop: '8px' }} />
        </div>
      ))}
    </div>
  );

  const renderPanelContent = () => (
    <>
      <BookDetailsPanel
        book={selectedBook}
        onActionComplete={fetchData}
        onClose={handleClosePanel}
      />
      {mobileOpen && (
        <div
          className="home-panel-backdrop"
          onClick={handleClosePanel}
        />
      )}
    </>
  );

  return (
    <div className="home-content-row">
      {/* Center: Search + Grid */}
      <div className="home-center-column">
        {/* Search Bar */}
        <div className="home-search-wrapper">
          <span className="home-search-icon">🔍</span>
          <input
            type="text"
            className="home-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search books by title or author..."
          />
          {search && (
            <button className="home-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Section Header */}
        <div className="home-section-header">
          <h2 className="home-section-title">📍 Books Near You</h2>
          <p className="home-section-subtitle">
            Showing books near you •{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Borrow</span> •{' '}
            <span style={{ color: 'var(--accent-info)' }}>Rent</span> •{' '}
            <span style={{ color: 'var(--accent-success)' }}>Buy</span> •{' '}
            <span style={{ color: 'var(--text-muted)' }}>Share</span>
          </p>
        </div>

        {/* Book Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filteredBooks.length > 0 ? (
          <BookGrid books={filteredBooks} onSelect={handleSelect} />
        ) : (
          <EmptyState
            icon="🔍"
            title="No books found"
            description={search
              ? `No books match "${search}". Try a different search.`
              : 'No available books found in your area.'}
          />
        )}
      </div>

      {/* Render panel via portal into DashboardLayout if slot exists, else fallback inline */}
      {rightPanelElement ? createPortal(renderPanelContent(), rightPanelElement) : renderPanelContent()}
    </div>
  );
};

export default Home;
