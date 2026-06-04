// ============================================
// AdminDashboard.jsx - Super Control Panel
// ============================================
import { useState, useEffect } from "react";
import { booksAPI } from "../services/api";
import styles from "./LibrarianDashboard.module.css"; // Reuse staff styles for consistency

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, books: 0, libraries: 0 });
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        // Admin usually gets ALL data
        const res = await booksAPI.getAll();
        if (res.data.success) {
           setAllBooks(res.data.books);
           setStats({
             users: 124, // Mock for now
             books: res.data.count,
             libraries: 12
           });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAdminData();
  }, []);

  return (
    <div className={styles.adminPage}>
      {/* Admin Sidebar would go here, reusing librarian styles */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>🛡️</div>
          <span className={styles.logoText}>AdminPanel</span>
        </div>
        <nav className={styles.nav}>
           <button className={`${styles.navItem} ${styles.activeNavItem}`}>🏢 System Health</button>
           <button className={styles.navItem}>👥 User Management</button>
           <button className={styles.navItem}>📚 Global Inventory</button>
           <button className={styles.navItem}>📑 Audit Logs</button>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>System Overview</h1>
          <p className={styles.sectionDesc}>Master control for the Hybrid Library Marketplace.</p>
        </div>

        <div className={styles.statsGrid}>
           <div className={styles.statCard}>
              <div className={styles.statLabel}>Active Members</div>
              <div className={styles.statValue}>{stats.users}</div>
           </div>
           <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Listings</div>
              <div className={styles.statValue}>{stats.books}</div>
           </div>
           <div className={styles.statCard}>
              <div className={styles.statLabel}>Partner Libraries</div>
              <div className={styles.statValue}>{stats.libraries}</div>
           </div>
        </div>

        <div className={styles.tableContainer}>
           <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Book Title</th>
                  <th className={styles.th}>Provider</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Operations</th>
                </tr>
              </thead>
              <tbody>
                 {allBooks.slice(0, 10).map(book => (
                   <tr key={book._id}>
                      <td className={styles.td}><strong>{book.title}</strong></td>
                      <td className={styles.td}>{book.owner?.username || "Library"}</td>
                      <td className={styles.td}>{book.status}</td>
                      <td className={styles.td}>
                         <button className={styles.primaryBtn} style={{ padding: '4px 12px' }}>Review</button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
