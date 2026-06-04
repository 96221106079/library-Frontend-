import BookCard from './BookCard';
import './BookGrid.css';

const BookGrid = ({ books, onSelect }) => {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="premium-book-grid">
      {books.map(book => (
        <BookCard 
          key={book._id || book.id} 
          book={book} 
          onSelect={onSelect} 
        />
      ))}
    </div>
  );
};

export default BookGrid;
