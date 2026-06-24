import { useState, useEffect } from 'react';
import { requestAPI, transactionAPI } from '../services/api';
import { StatusProgress, EmptyState, Skeleton } from '../components/UI/CoreComponents';

const ActivityPage = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const reqRes = await requestAPI.getMyRequests();
      const transRes = await transactionAPI.getMy();

      if (reqRes.data.success) setRequests(reqRes.data.requests || []);
      if (transRes.data.success) {
        const items = transRes.data.transactions || [];
        setOrders(items.filter(t => t.type === 'buy'));
        setRentals(items.filter(t => t.type === 'rent'));
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (requestId) => {
    if (!otp) return alert('Enter OTP');

    try {
      setVerifyingId(requestId);
      const res = await requestAPI.verify(requestId, otp);
      if (res.data.success) {
        alert('✅ Verified! Book delivered.');
        fetchActivity();
        setOtp('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const renderRequestCard = (req) => {
    const statusSteps = ['Requested', 'Accepted', 'OTP Generated', 'Verified', 'Delivered'];
    const statusMap = {
      requested: 0,
      accepted: 1,
      otp_generated: 2,
      verified: 3,
      delivered: 4,
    };

    const currentStep = statusMap[req.status] || 0;

    return (
      <div
        key={req._id}
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        {/* Book & Status */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <img
            src={req.book?.image}
            alt={req.book?.title}
            style={{
              width: '80px',
              height: '100px',
              borderRadius: '8px',
              objectFit: 'cover',
            }}
          />

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>
              {req.book?.title}
            </h4>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>
              by {req.book?.author}
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#6366f1',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              {req.status.toUpperCase().replace('_', ' ')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#334155', fontSize: '13px' }}>
              {new Date(req.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Progress */}
        <div style={{ marginBottom: '20px' }}>
          <StatusProgress steps={statusSteps} currentStep={currentStep} />
        </div>

        {/* OTP Verification */}
        {req.status === 'otp_generated' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: '0 0 12px 0', color: '#fbbf24', fontWeight: '600' }}>
              Enter OTP to verify delivery
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength="6"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#0f172a',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={() => handleVerifyOTP(req._id)}
                disabled={verifyingId === req._id}
                style={{
                  padding: '10px 16px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {verifyingId === req._id ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {req.status === 'accepted' && (
            <button
              style={{
                flex: 1,
                padding: '10px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Ready to Meet
            </button>
          )}
          <button
            style={{
              flex: 1,
              padding: '10px',
              background: 'transparent',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            📞 Contact
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ marginBottom: '16px' }}>
          <Skeleton width="100%" height="200px" />
        </div>
      ));
    }

    let items = [];
    if (activeTab === 'requests') items = requests;
    else if (activeTab === 'orders') items = orders;
    else items = rentals;

    if (items.length === 0) {
      return (
        <EmptyState
          icon={
            activeTab === 'requests'
              ? '📬'
              : activeTab === 'orders'
              ? '🛍️'
              : '📚'
          }
          title={
            activeTab === 'requests'
              ? 'No requests yet'
              : activeTab === 'orders'
              ? 'No orders yet'
              : 'No rentals yet'
          }
          description="Check back soon for updates"
        />
      );
    }

    return items.map(item =>
      activeTab === 'requests'
        ? renderRequestCard(item)
        : renderOrderCard(item)
    );
  };

  const renderOrderCard = (order) => {
    return (
      <div
        key={order._id}
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
        }}
      >
        <img
          src={order.book?.image}
          alt={order.book?.title}
          style={{
            width: '80px',
            height: '100px',
            borderRadius: '8px',
            objectFit: 'cover',
          }}
        />

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>
            {order.book?.title}
          </h4>
          <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>
            by {order.book?.author}
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#86efac',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              ✓ {order.status.toUpperCase()}
            </span>
            <span style={{ color: '#334155', fontSize: '13px' }}>
              ₹{order.totalPrice}
            </span>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          {order.dueDate && (
            <p style={{ margin: '8px 0 0 0', color: '#f59e0b', fontSize: '13px' }}>
              📅 Return by: {new Date(order.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <button
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: '#6366f1',
            border: '1px solid #6366f1',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Details
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '900px',
        margin: '0 auto',
        paddingBottom: '100px',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
        📋 Activity & Tracking
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          marginBottom: '24px',
        }}
      >
        {[
          { id: 'requests', label: '📬 Requests', count: requests.length },
          { id: 'orders', label: '🛍️ Orders', count: orders.length },
          { id: 'rentals', label: '📚 Rentals', count: rentals.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : 'none',
              color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 200ms ease',
            }}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderTabContent()}
    </div>
  );
};

export default ActivityPage;
