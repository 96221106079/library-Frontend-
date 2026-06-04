import { NavLink, useNavigate } from "react-router-dom";
import styles from "./MarketplaceNavbar.module.css";

// ── Icons ───────────────────────────────────────
const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#8b1874" : "none"} stroke={active ? "#8b1874" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBooks = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#8b1874" : "none"} stroke={active ? "#8b1874" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" />
  </svg>
);

const IconLibrary = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#8b1874" : "none"} stroke={active ? "#8b1874" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconActivity = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#8b1874" : "none"} stroke={active ? "#8b1874" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-2-3H5l-2 3M21 8v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8M21 8H3M10 12h4" />
  </svg>
);

const IconPlus = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const MarketplaceNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <NavLink to="/home" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <IconHome active={isActive} />
            <span className={styles.label}>Home</span>
          </>
        )}
      </NavLink>

      <NavLink to="/my-books" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <IconBooks active={isActive} />
            <span className={styles.label}>My Books</span>
          </>
        )}
      </NavLink>

      {/* Central FAB */}
      <div className={styles.fabWrapper}>
        <button className={styles.fab} onClick={() => navigate("/add-book")}>
          <IconPlus />
        </button>
        <span className={styles.label}>Sell Now</span>
      </div>

      <NavLink to="/nearby-libraries" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <IconLibrary active={isActive} />
            <span className={styles.label}>Libraries</span>
          </>
        )}
      </NavLink>

      <NavLink to="/activity" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
        {({ isActive }) => (
          <>
            <IconActivity active={isActive} />
            <span className={styles.label}>Activity</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};

export default MarketplaceNavbar;
