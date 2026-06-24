import { useState, useEffect } from "react";
import { transactionAPI, libraryTransactionAPI, libraryAPI, requestAPI, rentAPI } from "../services/api";
import LiveTrackingModal from "../components/marketplace/LiveTrackingModal";
import ReviewModal from "../components/marketplace/ReviewModal";
import styles from "./Activity.module.css";

// ============================================================
// Activity.jsx — Refined P2P & Rental Dashboard
// ============================================================

const BUY_STEPS = [
  { label: "Requested", icon: "📩" },
  { label: "Accepted",  icon: "🤝" },
  { label: "Verified",  icon: "🔐" },
  { label: "Completed",icon: "🎉" },
];
const RENT_STEPS = [
  { label: "Requested", icon: "📩" },
  { label: "Accepted",  icon: "🤝" },
  { label: "Verified",  icon: "🔐" },
  { label: "Rented",    icon: "📖" },
  { label: "Returned",  icon: "↩️" },
  { label: "Completed", icon: "🎉" },
];
const STATUS_TO_STEP = {
  REQUESTED: 0,
  ACCEPTED: 1,
  OTP_VERIFIED: 2,
  VERIFIED: 2,
  RENTED: 3,
  RETURNED: 4,
  COMPLETED: 5,
  REJECTED: -1,
};

const StepBar = ({ status, type }) => {
  const normStatus = status?.toUpperCase();
  const isRent = type === "rent" || type === "RENTAL";
  const steps = isRent ? RENT_STEPS : BUY_STEPS;
  const currentStep = STATUS_TO_STEP[normStatus] ?? 0;

  if (normStatus === "REJECTED") return (
    <div className={styles.rejectedBar}>
      <span className={styles.rejectedIcon}>✕</span>
      Request Rejected
    </div>
  );

  const progressPct = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100;

  return (
    <div className={styles.stepBarWrapper}>
      {/* Continuous track + animated fill */}
      <div className={styles.stepTrack}>
        <div className={styles.stepTrackFill} style={{ width: `${progressPct}%` }} />
      </div>

      <div className={styles.stepBar}>
        {steps.map(({ label, icon }, i) => {
          const isDone   = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;
          return (
            <div key={i} className={styles.stepItem}>
              <div className={[
                styles.stepDot,
                isDone   ? styles.stepDotDone   : "",
                isActive ? styles.stepDotActive : "",
                isPending? styles.stepDotPending: "",
              ].join(" ")}>
                {isDone ? <span className={styles.checkMark}>✓</span> : <span className={styles.stepIcon}>{icon}</span>}
                {isActive && <span className={styles.pulseRing} />}
              </div>
              <span className={[
                styles.stepLabel,
                isDone   ? styles.stepLabelDone   : "",
                isActive ? styles.stepLabelActive : "",
              ].join(" ")}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Activity = () => {
  const [data, setData] = useState({ pending: [], onDelivery: [], shelf: [], past: [] });
  const [activeTab, setActiveTab] = useState("active");
  const [libTxns, setLibTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingTxn, setTrackingTxn] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookForReview, setSelectedBookForReview] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [p2pRes, libRes, reqRes, rentRes] = await Promise.allSettled([
        transactionAPI.getMy(),
        libraryTransactionAPI.getMy(),
        requestAPI.getMyRequests(),
        rentAPI.getMy()
      ]);

      let pending = [];
      let onDelivery = [];
      let shelf = [];
      let past = [];

      // 1. Process Transaction Model (Legacy/P2P)
      if (p2pRes.status === 'fulfilled' && p2pRes.value.data.success) {
        const d = p2pRes.value.data;
        pending = [...pending, ...(d.requested || [])];
        onDelivery = [...onDelivery, ...(d.accepted || [])];
        shelf = [...shelf, ...(d.completed || []).filter(t => t.status === 'delivered')];
        past = [...past, ...(d.completed || []).filter(t => t.status === 'returned')];
      }

      // 2. Process Unified Request Model
      if (reqRes.status === 'fulfilled' && reqRes.value.data.success) {
        const { asOwner, asBorrower } = reqRes.value.data;
        [...asOwner, ...asBorrower].forEach(r => {
          const status = r.status.toUpperCase();
          if (status === "REQUESTED") pending.push(r);
          else if (status === "ACCEPTED" || status === "OTP_VERIFIED" || status === "VERIFIED") onDelivery.push(r);
          else if (status === "RENTED" || status === "RETURNED") shelf.push(r);
          else if (status === "REJECTED" || status === "COMPLETED") past.push(r);
        });
      }

      // 3. Process Rental Model
      if (rentRes.status === 'fulfilled' && rentRes.value.data.success) {
        (rentRes.value.data.rentals || []).forEach(r => {
          const status = r.status.toUpperCase();
          if (status === "REQUESTED") pending.push({ ...r, isDedicatedRent: true });
          else if (status === "ACCEPTED" || status === "VERIFIED") onDelivery.push({ ...r, isDedicatedRent: true });
          else if (status === "RENTED" || status === "RETURNED") shelf.push({ ...r, isDedicatedRent: true });
          else past.push({ ...r, isDedicatedRent: true });
        });
      }

      setData({ pending, onDelivery, shelf, past });
      if (libRes.status === 'fulfilled' && libRes.value.data.success) setLibTxns(libRes.value.data.transactions || []);
    } catch (err) { console.error("Fetch err:", err); } finally { setLoading(false); }
  };

  const handleAction = async (txn, action, otp = null) => {
    try {
      setProcessingId(txn._id);
      let res;
      const isRent = txn.isDedicatedRent;
      const api = isRent ? rentAPI : requestAPI;

      if (action === "accept") {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          res = await api.accept(txn._id, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (res?.data?.success) fetchData();
          setProcessingId(null);
        }, async () => {
          res = await api.accept(txn._id);
          if (res?.data?.success) fetchData();
          setProcessingId(null);
        });
        return;
      }

      if (action === "verify") res = await (isRent ? api.verify(txn._id, otp) : api.verifyOtp(txn._id, otp));
      else if (action === "start") res = await api.start(txn._id);
      else if (action === "confirm") res = await api.confirmHandover(txn._id);
      else if (action === "return") res = await (isRent ? api.return(txn._id) : api.returnBook(txn._id));
      else if (action === "complete") res = await api.complete(txn._id);
      else if (action === "reject") res = await api.reject(txn._id);

      if (res?.data?.success) { fetchData(); alert(`${action} successful!`); }
    } catch (err) { alert(`${action} failed.`); } finally { setProcessingId(null); }
  };

  const renderCard = (txn, mode) => {
    const isBorrower = (txn.borrowerId?._id || txn.borrowerId || txn.requesterId || txn.renterId?._id || txn.renterId) === currentUserId;
    const status = txn.status?.toUpperCase();
    const type = txn.type?.toUpperCase() || (txn.isDedicatedRent ? "RENT" : "BUY");
    const book = txn.bookId;

    return (
      <div key={txn._id} className={`${styles.card} ${mode === 'past' ? styles.cardCompleted : ''}`}>
        <div className={styles.cardMain}>
          <img src={book?.image} alt="" className={styles.bookImg} />
          <div className={styles.info}>
            <h4 className={styles.bookTitle}>{book?.title}</h4>
            <span className={`${styles.typeBadge} ${type === 'RENT' ? styles.typeBadgeRent : styles.typeBadgeBuy}`}>
              {type === 'RENT' ? "📅 RENTAL" : "💰 PURCHASE"}
            </span>
            {status === "RENTED" && txn.dueDate && (
              <p className={new Date() > new Date(txn.dueDate) ? styles.fineInfo : styles.waitingMeta}>
                Due: {new Date(txn.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={status === 'COMPLETED' ? styles.completedPill : styles.acceptedPill}>{status}</span>
        </div>

        {mode !== 'past' && <StepBar status={status} type={type.toLowerCase()} />}

        <div className={styles.cardActions}>
          {/* ACTIVE ACTIONS */}
          {mode !== 'past' && (
            <>
              {/* PENDING ACTIONS */}
              {status === "REQUESTED" && (
                isBorrower ? <div className={styles.waitingBox}><p className={styles.waitingTitle}>Waiting for owner...</p></div> :
                <div className={styles.responseGroup}>
                  <button className={styles.acceptBtn} onClick={() => handleAction(txn, 'accept')}>Accept</button>
                  <button className={styles.rejectBtn} onClick={() => handleAction(txn, 'reject')}>Decline</button>
                </div>
              )}

              {/* HANDOVER ACTIONS */}
              {(status === "ACCEPTED" || status === "VERIFIED") && (
                isBorrower ? <div className={styles.otpShowBox}><p className={styles.otpShowLabel}>Show OTP to Owner: <strong className={styles.otpCode}>{txn.otp}</strong></p></div> :
                <div className={styles.otpVerifyBox}>
                  <input className={styles.otpInput} maxLength={6} placeholder="OTP" onChange={e => setOtpInputs({...otpInputs, [txn._id]: e.target.value})} />
                  <button className={styles.verifyBtn} onClick={() => handleAction(txn, 'verify', otpInputs[txn._id])}>Verify</button>
                </div>
              )}

              {status === "OTP_VERIFIED" && (
                !isBorrower ? <button className={styles.acceptBtn} onClick={() => handleAction(txn, 'confirm')}>Confirm Handover</button> :
                <p className={styles.otpPending}>Waiting for owner to confirm handover...</p>
              )}

              {status === "VERIFIED" && !isBorrower && txn.isDedicatedRent && <button className={styles.acceptBtn} onClick={() => handleAction(txn, 'start')}>Start Rental</button>}

              {/* SHELF ACTIONS (RENTAL FOCUS) */}
              {status === "RENTED" && (
                isBorrower ? <button className={styles.returnBtn} onClick={() => handleAction(txn, 'return')}>🔄 Return Book</button> :
                <p className={styles.otpPending}>Book is with borrower. Expected back: {txn.dueDate ? new Date(txn.dueDate).toLocaleDateString() : 'soon'}</p>
              )}

              {status === "RETURNED" && (
                !isBorrower ? <button className={styles.acceptBtn} onClick={() => handleAction(txn, 'complete')}>Confirm Receipt & End Rental</button> :
                <p className={styles.otpPending}>Returned! Awaiting owner confirmation.</p>
              )}
            </>
          )}

          {/* HISTORY ACTIONS */}
          {status === "COMPLETED" && isBorrower && (
             <button className={styles.trackBtn} onClick={() => {setSelectedBookForReview(book); setShowReviewModal(true);}}>⭐ Review</button>
          )}

          {status !== "COMPLETED" && <button className={styles.trackBtn} onClick={() => setTrackingTxn(txn)}>📍 Track</button>}
        </div>
      </div>
    );
  };

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;
  const activeCount = data.pending.length + data.onDelivery.length + data.shelf.length;
  const pastCount = data.past.length + libTxns.length;

  return (
    <div className={styles.container}>
      <header className={styles.header}><h1>📋 My Activity</h1><p>Manage your active requests and rental library.</p></header>
      
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'active' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('active')}>🔥 Active Activity {activeCount > 0 && <span className={styles.tabCount}>{activeCount}</span>}</button>
        <button className={`${styles.tabBtn} ${activeTab === 'past' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('past')}>🕒 History {pastCount > 0 && <span className={styles.tabCount}>{pastCount}</span>}</button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'active' && (
          <div className={styles.activeWrapper}>
            {data.pending.length > 0 && <div className={styles.section}><div className={styles.sectionHeader}><h3>📨 Incoming & Pending</h3><span className={styles.count}>{data.pending.length}</span></div><div className={styles.grid}>{data.pending.map(t => renderCard(t, 'active'))}</div></div>}
            {data.onDelivery.length > 0 && <div className={styles.section}><div className={styles.sectionHeader}><h3>🚚 In Handover / Delivery</h3><span className={styles.count}>{data.onDelivery.length}</span></div><div className={styles.grid}>{data.onDelivery.map(t => renderCard(t, 'active'))}</div></div>}
            {data.shelf.length > 0 && <div className={styles.section}><div className={styles.sectionHeader}><h3>📚 On My Shelf (Rented)</h3><span className={styles.count}>{data.shelf.length}</span></div><div className={styles.grid}>{data.shelf.map(t => renderCard(t, 'active'))}</div></div>}
            {activeCount === 0 && <div className={styles.emptyHero}><h3>No active activity found.</h3><p>Browse books to start your journey!</p></div>}
          </div>
        )}
        {activeTab === 'past' && (
          <div className={styles.grid}>
            {data.past.map(t => renderCard(t, 'past'))}
            {libTxns.map(t => <div key={t._id} className={`${styles.card} ${styles.cardCompleted}`}><div className={styles.cardMain}><img src={t.bookId?.image} className={styles.bookImg}/><div className={styles.info}><h4 className={styles.bookTitle}>{t.bookId?.title}</h4><p className={styles.bookAuthor}>Institutional Project</p></div><span className={styles.completedPill}>✓ {t.status}</span></div></div>)}
            {pastCount === 0 && <p className={styles.emptyText}>No history.</p>}
          </div>
        )}
      </div>

      {trackingTxn && <LiveTrackingModal requestId={trackingTxn._id} role={(trackingTxn.ownerId?._id === currentUserId || trackingTxn.ownerId === currentUserId) ? "owner" : "borrower"} book={trackingTxn.bookId} initialLocations={{ownerLocation: trackingTxn.ownerLocation, borrowerLocation: trackingTxn.borrowerLocation || trackingTxn.renterLocation}} onClose={() => setTrackingTxn(null)}/>}
      {showReviewModal && selectedBookForReview && <ReviewModal book={selectedBookForReview} onClose={() => setShowReviewModal(false)} onSaved={() => fetchData()}/>}
    </div>
  );
};

export default Activity;
