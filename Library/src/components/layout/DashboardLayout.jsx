import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'User' };
  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'US';

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/home', label: '🏠 Home' },
    { path: '/my-books', label: '📚 My Books' },
    { path: '/libraries', label: '🏛️ Libraries' },
    { path: '/activity', label: '⚡ Activity' },
    { path: '/events', label: '📅 Events' },
    { path: '/profile', label: '👤 Profile' },
  ];

  return (
    <div className={styles.dashboardWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <span>Hybrid</span> Library
        </div>
        
        <div className={styles.headerActions}>
          {/* Notification Icon */}
          <button style={{ 
            background: 'rgba(0, 0, 0, 0.04)', 
            border: '1px solid var(--card-border)',
            width: '40px', 
            height: '40px', 
            borderRadius: '50%',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px'
          }}>
            🔔
          </button>
          
          <div className={styles.avatar}>{initials}</div>
        </div>
      </header>

      {/* Body Area */}
      <div className={styles.dashboardBody}>
        {/* Left Sidebar */}
        <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.open : ''}`}>
          <nav className={styles.navMenu}>
            {navItems.map(item => (
              <NavLink 
                key={item.path} 
                to={item.path}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          {/* User Profile Card at Bottom of Sidebar */}
          <div style={{
            marginTop: 'auto',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div className={styles.avatar} style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>User</div>
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>

        {/* Right Details Panel (Portal Target) */}
        <aside id="right-panel-root" className={styles.rightPanel}></aside>
      </div>

      {/* Bottom Nav for Mobile (Optional, could just use CSS to show/hide) */}
      <div className="mobile-bottom-nav" style={{ display: 'none' }}>
        {/* If there's an existing BottomNav component, it can be rendered here and styled appropriately for mobile */}
      </div>
    </div>
  );
};

export default DashboardLayout;
