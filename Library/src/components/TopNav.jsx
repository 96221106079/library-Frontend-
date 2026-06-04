import { useState, useEffect, useRef } from "react";
import { notificationAPI } from "../services/api";
import Toast from "./Toast";

const TopNav = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || user.username || 'Guest';
  const initial = userName.charAt(0).toUpperCase();

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMine();
      if (res.data.success) {
        const newNotifications = res.data.notifications;
        const newUnreadCount = res.data.unreadCount;

        if (newUnreadCount > prevCountRef.current && newNotifications.length > 0) {
          const newest = newNotifications[0];
          setToast({ message: newest.message, type: "success" });
        }

        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
        prevCountRef.current = newUnreadCount;
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleDropdown = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      try {
        await notificationAPI.markRead();
        setUnreadCount(0);
        prevCountRef.current = 0;
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      background: 'linear-gradient(90deg, rgba(6,11,35,0.95) 0%, rgba(15,22,53,0.95) 100%)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(124, 77, 255, 0.08)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px rgba(124,77,255,0.4))' }}>📚</span>
          <span style={{
            fontSize: '20px', fontWeight: '800',
            background: 'linear-gradient(135deg, #7C4DFF 0%, #00C2FF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>Hybrid Library</span>
        </div>

        {/* Right side: Notifications + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notification Button */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={handleToggleDropdown}
              style={{
                background: 'rgba(124, 77, 255, 0.08)',
                border: '1px solid rgba(124, 77, 255, 0.12)',
                width: '42px', height: '42px', borderRadius: '14px', cursor: 'pointer',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#B8C0FF',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,77,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,77,255,0.08)'}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: 'linear-gradient(135deg, #FF5252, #D50000)',
                  color: '#fff', fontSize: '10px', fontWeight: '700', minWidth: '18px',
                  height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #060B23',
                  boxShadow: '0 2px 8px rgba(255,82,82,0.4)',
                }}>{unreadCount}</span>
              )}
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: '52px', right: 0, width: '340px',
                background: 'linear-gradient(180deg, #0F1635 0%, #151D48 100%)',
                border: '1px solid rgba(124, 77, 255, 0.12)',
                borderRadius: '16px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(124, 77, 255, 0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Notifications</h3>
                  <span style={{ fontSize: '11px', color: '#7D86B2', fontWeight: '600' }}>
                    {notifications.length} total
                  </span>
                </div>
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: '32px 20px', textAlign: 'center', color: '#7D86B2', fontSize: '13px', margin: 0 }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} style={{
                        padding: '14px 20px', display: 'flex', gap: '12px',
                        borderBottom: '1px solid rgba(124, 77, 255, 0.04)',
                        background: !n.isRead ? 'rgba(124, 77, 255, 0.04)' : 'transparent',
                        transition: 'background 0.2s ease',
                      }}>
                        <div style={{ fontSize: '16px', flexShrink: 0 }}>
                          {n.type === "REMINDER" ? "⏰" : n.type === "FINE" ? "⚠️" : "📩"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#B8C0FF', lineHeight: 1.5, fontWeight: '500' }}>{n.message}</p>
                          <span style={{ fontSize: '10px', color: '#7D86B2', fontWeight: '500' }}>
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7C4DFF 0%, #00C2FF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', fontWeight: '700', color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)',
            cursor: 'pointer',
          }}>
            {initial}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </nav>
  );
};

export default TopNav;
