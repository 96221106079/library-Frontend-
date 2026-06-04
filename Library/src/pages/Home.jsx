import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { booksAPI } from "../services/api";
import BookCard from "../components/marketplace/BookCard";
import BorrowRentModal from "../components/marketplace/BorrowRentModal";

const Home = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [actionType, setActionType] = useState("buy"); // "buy" or "rent"

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const locationStr = localStorage.getItem("userLocation");
      const searchMode = localStorage.getItem("searchMode");
      
      let res;
      if (locationStr && !searchMode) {
        const { lat, lng } = JSON.parse(locationStr);
        res = await booksAPI.getNearby(lat, lng, 10); // 10km radius
      } else {
        res = await booksAPI.getAll();
      }

      if (res.data.success) {
        setBooks(res.data.books);
      }
    } catch (err) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (book, type) => {
    setSelectedBook(book);
    setActionType(type);
    setModalOpen(true);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with Sell Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
            {localStorage.getItem("userLocation") && !localStorage.getItem("searchMode") ? "Books Near You" : "Marketplace"}
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>
            {localStorage.getItem("userLocation") && !localStorage.getItem("searchMode") 
              ? "Showing books within 10km of your location" 
              : "Explore books from all around the world"}
          </p>
        </div>
        <button 
          onClick={() => navigate("/add-book")}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✨</span> Sell Now
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ color: '#64748b', marginTop: '16px' }}>Loading marketplace...</p>
        </div>
      ) : books.length === 0 ? (
        <div style={{ 
          padding: '80px 20px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '32px', 
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>No books found</h2>
          <p style={{ color: '#64748b', maxWidth: '300px', margin: '0 auto' }}>
            Be the first to list a book in your community!
          </p>
          <button 
            onClick={() => navigate("/add-book")}
            style={{ 
              marginTop: '24px',
              padding: '12px 24px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            List a Book
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          {books.map(book => (
            <BookCard 
              key={book._id} 
              book={book} 
              onBuy={(b) => openActionModal(b, "buy")}
              onRent={(b) => openActionModal(b, "rent")}
              onRefresh={fetchBooks}
            />
          ))}
        </div>
      )}

      {/* Borrow/Rent Modal */}
      <BorrowRentModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        book={selectedBook}
        type={actionType}
        onSuccess={fetchBooks}
      />
    </div>
  );
};

export default Home;
