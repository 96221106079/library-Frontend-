// ============================================
// LibrarianDashboard.jsx - Official Staff Hub
// ============================================
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { transactionAPI, userAPI, libraryTransactionAPI } from "../services/api";
import styles from "./LibrarianDashboard.module.css";
import Toast from "../components/Toast";

const LibrarianDashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [otpInputs, setOtpInputs] = useState({}); // { txnId: "otp" }
  const [verifying, setVerifying] = useState({}); // { txnId: true/false }
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("outgoing"); // "outgoing" (Lib->User) vs "incoming" (User->Lib)
  const [libTransactions, setLibTransactions] = useState([]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await libraryTransactionAPI.getLibrarianDashboard();
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Sync Error: " + (err.response?.data?.message || "Could not fetch data"), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLibraryIncoming = async () => {
    try {
      setLoading(true);
      const res = await libraryTransactionAPI.getIncoming();
      if (res.data.success) {
        setLibTransactions(res.data.transactions || []);
      }
    } catch (err) {
      showToast("Failed to fetch incoming offers", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentFetch = activeTab === "outgoing" ? fetchTransactions : fetchLibraryIncoming;

  useEffect(() => {
    const checkRole = async () => {
       try {
          const res = await userAPI.getProfile();
          const u = res.data.user;
          if (u.role !== "librarian") {
             navigate("/dashboard");
          }
          setUser(u);
       } catch (e) {
          navigate("/login");
       }
    };
    checkRole();
    currentFetch();
  }, [navigate, activeTab]);

  const handleOtpChange = (txnId, value) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setOtpInputs(prev => ({ ...prev, [txnId]: clean }));
  };

  const verifyOtp = async (txnId) => {
    const otp = otpInputs[txnId];
    if (!otp || otp.length !== 6) return showToast("Enter 6-digit Code", "error");

    setVerifying(prev => ({ ...prev, [txnId]: true }));
    try {
      const res = await libraryTransactionAPI.verifyLibrarianOtp(txnId, otp);
      if (res.data.success) {
        showToast("Success! Hand over the book.");
        fetchTransactions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Verification Failed", "error");
    } finally {
      setVerifying(prev => ({ ...prev, [txnId]: false }));
    }
  };

  const handleAcceptOrder = async (id) => {
    try {
      setLoading(true);
      const res = await libraryTransactionAPI.acceptLibrarianOrder(id);
      if (res.data.success) {
        showToast("Request Accepted. OTP generated.");
        fetchTransactions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Accept failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLibAction = async (id, action) => {
     try {
        setLoading(true);
        let res;
        if (action === "accept") res = await libraryTransactionAPI.accept(id);
        else if (action === "reject") res = await libraryTransactionAPI.reject(id);
        else if (action === "deliver") res = await libraryTransactionAPI.deliver(id);

        if (res.data.success) {
           showToast(`Success: Item ${action}ed`);
           fetchLibraryIncoming();
        }
     } catch (err) {
        showToast(err.response?.data?.message || "Action failed", "error");
     } finally {
        setLoading(false);
     }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className={styles.adminPage}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🏛️</div>
          <span className={styles.logoText}>StaffHub</span>
        </div>
        <div className={styles.libBadge}>
           {user?.libraryName || "Official Library"} Staff
        </div>
        <nav className={styles.nav}>
          <button 
             className={`${styles.navItem} ${activeTab === "outgoing" ? styles.activeNavItem : ""}`}
             onClick={() => setActiveTab("outgoing")}
          >
            📑 Member Borrowing
          </button>
          <button 
             className={`${styles.navItem} ${activeTab === "incoming" ? styles.activeNavItem : ""}`}
             onClick={() => setActiveTab("incoming")}
          >
            📥 Incoming Offers
          </button>
          <div style={{ marginTop: 'auto', padding: '12px' }}>
             <button className={styles.navItem} onClick={handleLogout} style={{ color: '#ef4444' }}>
                🚪 Logout
             </button>
          </div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.mainHeader}>
            <h1 className={styles.sectionTitle}>
               {activeTab === "outgoing" ? "Verification Terminal" : "Procurement Desk"}
            </h1>
            <p className={styles.sectionDesc}>
               {activeTab === "outgoing" 
                  ? "Enter the unique code provided by the member to finalize the asset release." 
                  : "Review and manage books offered by community members to our library."
               }
            </p>
        </header>

        {loading ? (
           <div className={styles.loaderArea}>
              <div className={styles.spinner}></div>
              <span>Updating Ledger...</span>
           </div>
        ) : (activeTab === "outgoing" ? transactions : libTransactions).length === 0 ? (
           <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📂</div>
              <h3>No items to show</h3>
              <p>Transactions for your library will appear here once members interact with assets.</p>
           </div>
        ) : activeTab === "outgoing" ? (
           <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Member Detail</th>
                    <th>Book / Item</th>
                    <th>Status</th>
                    <th>Handover Code</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn._id}>
                      <td className={styles.td}>
                         <div className={styles.userInfo}>
                            <strong>{txn.userId?.name}</strong>
                            <span>@{txn.userId?.username || "member"}</span>
                         </div>
                      </td>
                      <td className={styles.td}>
                         <div className={styles.bookInfo}>
                            <strong>{txn.bookId?.title}</strong>
                            <span>{txn.bookId?.author}</span>
                         </div>
                      </td>
                      <td className={styles.td}>
                         <span className={styles.statusBadgeSmall}>
                            {txn.status.toUpperCase()}
                         </span>
                      </td>
                      <td className={styles.td}>
                         {txn.status === "ACCEPTED" ? (
                           <input 
                             type="text" 
                             className={styles.otpInput} 
                             placeholder="000000"
                             maxLength={6}
                             value={otpInputs[txn._id] || ""}
                             onChange={(e) => handleOtpChange(txn._id, e.target.value)}
                           />
                         ) : (
                           <span style={{color: '#64748b', fontSize: '11px'}}>
                             {txn.status === "REQUESTED" ? "Waiting for Accept" : "Finalized"}
                           </span>
                         )}
                      </td>
                      <td className={styles.td}>
                         {txn.status === "REQUESTED" ? (
                           <button 
                             className={styles.acceptBtn}
                             onClick={() => handleAcceptOrder(txn._id)}
                           >
                             ✓ Accept
                           </button>
                         ) : txn.status === "ACCEPTED" ? (
                           <button 
                             className={styles.primaryBtn} 
                             disabled={verifying[txn._id]}
                             onClick={() => verifyOtp(txn._id)}
                           >
                             {verifying[txn._id] ? "..." : "Verify OTP"}
                           </button>
                         ) : (
                           <span style={{color: '#10b981', fontWeight: 'bold'}}>Done</span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        ) : (
           /* INCOMING VIEW */
           <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Member Offer</th>
                    <th>Book Details</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {libTransactions.map(txn => (
                     <tr key={txn._id}>
                        <td className={styles.td}>
                           <strong>{txn.userId?.username}</strong>
                        </td>
                        <td className={styles.td}>
                           <strong>{txn.bookId?.title}</strong>
                           <div style={{fontSize: '11px', color: '#64748b'}}>{txn.bookId?.author}</div>
                        </td>
                        <td className={styles.td}>
                           <span className={styles.statusBadgeSmall}>{txn.status.toUpperCase()}</span>
                        </td>
                        <td className={styles.td}>
                           <div style={{display: 'flex', gap: '8px'}}>
                              {txn.status === "requested" && (
                                 <>
                                    <button className={styles.acceptBtn} onClick={() => handleLibAction(txn._id, 'accept')}>Accept</button>
                                    <button className={styles.rejectBtn} onClick={() => handleLibAction(txn._id, 'reject')}>Reject</button>
                                 </>
                              )}
                              {txn.status === "accepted" && (
                                 <div className={styles.otpToken}>
                                    OTP: <span>{txn.otp}</span>
                                    <p style={{fontSize: '9px', margin: '4px 0 0'}}>Give this to member</p>
                                 </div>
                              )}
                              {txn.status === "otp_verified" && (
                                 <button className={styles.primaryBtn} onClick={() => handleLibAction(txn._id, 'deliver')}>Confirm Receipt</button>
                              )}
                           </div>
                        </td>
                     </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}
      </main>
    </div>
  );
};

export default LibrarianDashboard;