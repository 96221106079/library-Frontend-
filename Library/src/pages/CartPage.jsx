import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../services/api';
import { EmptyState, Skeleton } from '../components/UI/CoreComponents';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      if (res.data.success) {
        setCartItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (bookId) => {
    try {
      const res = await cartAPI.remove(bookId);
      if (res.data.success) {
        setCartItems(cartItems.filter(item => item.bookId !== bookId));
      }
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      const res = await cartAPI.checkout({
        items: cartItems,
      });
      if (res.data.success) {
        alert('✅ Order placed! Check your activity.');
        setCartItems([]);
        navigate('/activity');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton width="100%" height="400px" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Start adding books to your cart!"
          action={{ label: 'Continue Shopping', action: () => navigate('/home') }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>🛒 Your Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cartItems.map(item => (
            <div
              key={item.bookId}
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {/* Book Image */}
              <img
                src={item.image}
                alt={item.title}
                style={{
                  width: '80px',
                  height: '100px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />

              {/* Book Info */}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#f1f5f9' }}>
                  {item.title}
                </h4>
                <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '13px' }}>
                  by {item.author}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={item.quantity || 1}
                    onChange={(e) => {
                      // Update quantity
                    }}
                    style={{
                      width: '50px',
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #475569',
                      background: '#1e293b',
                      color: '#f1f5f9',
                    }}
                  />
                  <span style={{ color: '#cbd5e1' }}>
                    ₹{item.price} each
                  </span>
                </div>
              </div>

              {/* Price & Remove */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '8px',
                }}>
                  ₹{(item.price * (item.quantity || 1)).toFixed(0)}
                </div>
                <button
                  onClick={() => handleRemove(item.bookId)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            padding: '20px',
            height: 'fit-content',
            position: 'sticky',
            top: '100px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
            Order Summary
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <span style={{ color: '#cbd5e1' }}>Subtotal</span>
            <span style={{ color: '#f1f5f9', fontWeight: '600' }}>₹{totalPrice.toFixed(0)}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <span style={{ color: '#cbd5e1' }}>Delivery</span>
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }}>FREE</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: '700',
          }}>
            <span>Total</span>
            <span style={{ color: '#6366f1' }}>₹{totalPrice.toFixed(0)}</span>
          </div>



          <button
            onClick={() => navigate('/home')}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'transparent',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            Continue Shopping
          </button>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#86efac',
          }}>
            ✓ Free shipping on all orders
            <br />
            ✓ Easy returns within 7 days
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
