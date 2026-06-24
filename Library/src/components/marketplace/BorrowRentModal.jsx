// ============================================
// BorrowRentModal.jsx -> Checkout & Payment Modal
// ============================================
import { useState } from "react";

import { requestAPI } from "../../services/api";

const STEPS = {
  CONFIRM: "confirm",
  SUCCESS: "success",
};

const BorrowRentModal = ({ isOpen, onClose, book, type, onSuccess }) => {
  const [step, setStep] = useState(STEPS.CONFIRM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !book) return null;

  const isBuy = type === "buy";
  const actionLabel = isBuy ? "Purchase" : "Rent";
  const accentColor = isBuy ? "#10b981" : "#f59e0b";
  const accentBg = isBuy
    ? "linear-gradient(135deg, #10b981, #059669)"
    : "linear-gradient(135deg, #f59e0b, #d97706)";

  const handleInitiateRequest = () => {
    handleSendRequest();
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const bookId = book._id || book.id;
      const res = await requestAPI.buy(bookId, isBuy ? "buy" : "rent");

      if (res.data.success) {
        setStep(STEPS.SUCCESS);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Fail.");
      setStep(STEPS.CONFIRM);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(STEPS.CONFIRM);
    setError("");
    onClose();
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3000, padding: '20px'
  };

  const modalStyle = {
    background: '#0f172a', width: '100%', maxWidth: '420px',
    borderRadius: '28px', border: '1px solid rgba(0, 0, 0, 0.08)',
    position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
  };

  const contentStyle = {
    padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div style={modalStyle}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(0, 0, 0, 0.08)', borderRadius: '2px', margin: '12px auto 0' }} />

        {/* ── STEP 1: CONFIRM ── */}
        {step === STEPS.CONFIRM && (
          <div style={contentStyle}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isBuy ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)", marginBottom: '20px' }}>
              <span style={{ fontSize: "2rem" }}>{isBuy ? "💰" : "⌛"}</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>Complete {actionLabel}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              {isBuy
                ? "You are about to permanently purchase this book."
                : "You are renting this book for a limited duration."}
            </p>

            <div style={{ width: '100%', padding: '16px', background: "rgba(0, 0, 0, 0.02)", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', color: "#0f172a", fontSize: '14px' }}>{book.title}</strong>
                <span style={{ color: "#64748b", fontSize: '12px' }}>by {book.author}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: accentColor }}>
                ₹{isBuy ? book.buyPrice : book.rentPrice}
              </div>
            </div>

            <div style={{ width: '100%', padding: '15px', borderRadius: '12px', background: "rgba(0,0,0,0.05)", display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Item Total</span>
                <span>₹{isBuy ? book.buyPrice : book.rentPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Service Fee</span>
                <span style={{ color: "#10b981", fontWeight: '700' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', fontWeight: '700', fontSize: '15px' }}>
                <span style={{ color: '#64748b' }}>Grand Total</span>
                <span style={{ color: "#0f172a" }}>₹{isBuy ? book.buyPrice : book.rentPrice}</span>
              </div>
            </div>

            {error && <p style={{ color: '#f43f5e', fontSize: '13px', margin: '0 0 16px' }}>⚠️ {error}</p>}

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.08)', background: 'transparent', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }} onClick={handleClose}>Cancel</button>
              <button
                style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: accentBg, color: '#0f172a', fontWeight: '800', cursor: 'pointer' }}
                onClick={handleInitiateRequest}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Request"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SUCCESS ── */}
        {step === STEPS.SUCCESS && (
          <div style={contentStyle}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: "rgba(16, 185, 129, 0.1)", marginBottom: '20px' }}>
              <span style={{ fontSize: "2rem" }}>🎉</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>Request Successful!</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              Your {actionLabel.toLowerCase()} request has been sent. Track it in your <strong>Activity</strong> dashboard.
            </p>

            <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 800, color: "#10b981", fontSize: '14px' }}>📦 Order Confirmed</p>
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                Verify the book handover using the OTP in your Activity tab once the owner accepts.
              </p>
            </div>

            <button
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: accentBg, color: '#0f172a', fontWeight: '800', cursor: 'pointer' }}
              onClick={() => {
                onSuccess?.();
                handleClose();
              }}
            >
              Go to Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowRentModal;
