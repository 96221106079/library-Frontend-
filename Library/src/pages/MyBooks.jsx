import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { booksAPI, transactionAPI } from "../services/api";

const MyBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const booksRes = await booksAPI.getMyBooks();
      if (booksRes.data.success) {
        setBooks(booksRes.data.books || []);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };



  const getStatusStyle = (status) => {
    const map = {
      available: { bg: "#ecfdf5", color: "#16a34a" },
      pending: { bg: "#fffbeb", color: "#b45309" },
      accepted: { bg: "#e0f2fe", color: "#0369a1" },
      completed: { bg: "#f1f5f9", color: "#64748b" },
      returned: { bg: "#f1f5f9", color: "#64748b" },
    };
    return map[status] || { bg: "#f1f5f9", color: "#64748b" };
  };

  return (
    <div style={{ padding: "20px", paddingBottom: "100px", maxWidth: "1000px", margin: "0 auto", minHeight: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0, background: "linear-gradient(to right, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>My Collection</h1>
          <p style={{ color: "#94a3b8", margin: "8px 0 0", fontSize: "16px" }}>Manage your private library and lendings</p>
        </div>
        <button onClick={() => navigate("/add-book")} style={{
          background: "#6366f1", color: "#fff", padding: "14px 28px", borderRadius: "16px",
          border: "none", fontWeight: "800", cursor: "pointer", fontSize: "15px",
          boxShadow: "0 10px 20px rgba(99,102,241,0.25)", transition: "all 0.3s ease"
        }}>
          + List New Book
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px", color: "#64748b", fontSize: "18px" }}>Loading your library...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {books.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "32px", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>📖</div>
              <h3 style={{ fontSize: "24px", margin: "0 0 10px" }}>No books listed yet</h3>
              <p style={{ color: "#64748b" }}>Share your collection with the community to start earning!</p>
            </div>
          ) : books.map(book => {
            const s = getStatusStyle(book.status);
            return (
              <div key={book._id} style={{
                background: "rgba(30,41,59,0.4)", borderRadius: "24px", overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)"
              }}>
                <div style={{ height: "200px", position: "relative" }}>
                  <img src={book.image} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{
                    position: "absolute", top: "16px", right: "16px",
                    padding: "6px 12px", borderRadius: "10px", fontSize: "12px",
                    fontWeight: 800, background: s.bg, color: s.color, textTransform: "uppercase",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                  }}>
                    {book.status}
                  </span>
                </div>
                <div style={{ padding: "20px" }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "800" }}>{book.title}</h4>
                  <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#94a3b8" }}>by {book.author}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", fontSize: "13px", color: "#94a3b8" }}>
                      {book.category}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                      {book.buyPrice > 0 && (
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#10b981" }}>
                          Buy: ₹{book.buyPrice}
                        </span>
                      )}
                      {book.rentPrice > 0 && (
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#6366f1" }}>
                          Rent: ₹{book.rentPrice}/wk
                        </span>
                      )}
                      {!(book.buyPrice > 0) && !(book.rentPrice > 0) && (
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                          Price Not Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBooks;


