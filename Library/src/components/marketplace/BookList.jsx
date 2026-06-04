// ============================================
// BookList.jsx - Horizontal Scrollable Book List
// ============================================
import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import BookSkeleton from "./BookSkeleton";




const BookList = ({ title, books, loading, onBorrow, onRent }) => {
  const sectionStyle = {
    marginBottom: '32px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '0 4px'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '800',
    color: '#f1f5f9',
    margin: 0
  };

  const scrollContainerStyle = {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '170px',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '12px',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none'
  };

  return (
    <div style={sectionStyle}>
      {/* Section Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{title || "Books"}</h3>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div style={scrollContainerStyle}>
        {loading === true ? (
          Array.from({ length: 5 }).map((_, i) => (
            <BookSkeleton key={i} />
          ))
        ) : !Array.isArray(books) || books.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📭</span>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No books found nearby</p>
          </div>
        ) : (
          books.map((book) => (
            <BookCard
              key={book.id || book._id}
              book={book}
              onBorrow={onBorrow}
              onRent={onRent}
            />
          ))
        )
        }
      </div>
    </div>
  );
};

export default BookList;
