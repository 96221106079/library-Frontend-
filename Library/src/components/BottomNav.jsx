import { NavLink } from "react-router-dom";

const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBooks = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconLibrary = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const IconActivity = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconEvents = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#7C4DFF" : "none"} stroke={active ? "#7C4DFF" : "#7D86B2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.5" />
  </svg>
);

const BottomNav = () => {
  const navItems = [
    { to: "/home", label: "Home", icon: IconHome },
    { to: "/my-books", label: "My Books", icon: IconBooks },
    { to: "/libraries", label: "Libraries", icon: IconLibrary },
    { to: "/activity", label: "Activity", icon: IconActivity },
    { to: "/events", label: "Events", icon: IconEvents },
    { to: "/profile", label: "Profile", icon: IconProfile },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '68px',
      background: 'linear-gradient(90deg, rgba(6,11,35,0.97) 0%, rgba(15,22,53,0.97) 100%)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(124, 77, 255, 0.08)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '600px',
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(124, 77, 255, 0.12)' : 'transparent',
                  transition: 'all 0.25s ease',
                }}>
                  <item.icon active={isActive} />
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  color: isActive ? '#7C4DFF' : '#7D86B2',
                  transition: 'color 0.25s ease',
                }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
