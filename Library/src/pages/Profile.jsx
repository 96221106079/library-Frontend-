import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { booksAPI, eventAPI, transactionAPI, requestAPI, rentAPI } from "../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    booksShared: null,
    activeRentals: null,
    transactions: null,
    eventsJoined: null,
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
    if (storedUser) fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [booksRes, eventsRes, p2pRes, reqRes, rentRes] = await Promise.allSettled([
        booksAPI.getMyBooks(),
        eventAPI.getAll({ myEvents: "true" }),
        transactionAPI.getMy(),
        requestAPI.getMyRequests(),
        rentAPI.getMy(),
      ]);

      let booksCount = 0;
      if (booksRes.status === "fulfilled" && booksRes.value?.data?.success)
        booksCount = booksRes.value.data.books?.length || 0;

      let eventsCount = 0;
      if (eventsRes.status === "fulfilled" && eventsRes.value?.data?.success)
        eventsCount = eventsRes.value.data.events?.length || 0;

      let activeRentals = 0, completedTxns = 0;
      const processTxn = (txn, isRentType) => {
        const status = (txn.status || "").toUpperCase().replace("_", " ");
        const type = (txn.type || "").toUpperCase() || (isRentType ? "RENT" : "BUY");
        if (type === "RENT" || type === "RENTAL") {
          if (["ACCEPTED", "OTP VERIFIED", "DELIVERED"].includes(status)) activeRentals++;
          if (["COMPLETED", "RETURNED"].includes(status)) completedTxns++;
        } else {
          if (["COMPLETED", "RETURNED", "DELIVERED", "PURCHASED", "SOLD"].includes(status)) completedTxns++;
        }
      };

      if (p2pRes.status === "fulfilled" && p2pRes.value?.data?.success) {
        const d = p2pRes.value.data;
        [...(d.requested || []), ...(d.accepted || []), ...(d.completed || [])].forEach(t => processTxn(t, false));
      }
      if (reqRes.status === "fulfilled" && reqRes.value?.data?.success) {
        const d = reqRes.value.data;
        [...(d.asOwner || []), ...(d.asBorrower || [])].forEach(t => processTxn(t, false));
      }
      if (rentRes.status === "fulfilled" && rentRes.value?.data?.success)
        (rentRes.value.data.rentals || []).forEach(t => processTxn(t, true));

      setStats({ booksShared: booksCount, activeRentals, transactions: completedTxns, eventsJoined: eventsCount });
    } catch {
      setStats({ booksShared: 0, activeRentals: 0, transactions: 0, eventsJoined: 0 });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#64748b", fontFamily: "Inter, sans-serif" }}>Loading profile...</p>
    </div>
  );

  const initials = (user.name || user.username || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "Member";

  const statCards = [
    { label: "Books Shared", value: stats.booksShared, icon: "📚", gradient: "linear-gradient(135deg,#7c3aed,#a855f7)", glow: "rgba(124,58,237,0.3)" },
    { label: "Active Rentals", value: stats.activeRentals, icon: "🔑", gradient: "linear-gradient(135deg,#0ea5e9,#38bdf8)", glow: "rgba(14,165,233,0.3)" },
    { label: "Completed", value: stats.transactions, icon: "✅", gradient: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.3)" },
    { label: "Events", value: stats.eventsJoined, icon: "🎟️", gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.3)" },
  ];

  const infoItems = [
    { label: "Full Name", value: user.name || "—", icon: "👤" },
    { label: "Username", value: `@${user.username || "—"}`, icon: "🏷️" },
    { label: "Email Address", value: user.email || "—", icon: "📧" },
    { label: "Account Role", value: (user.role || "user").charAt(0).toUpperCase() + (user.role || "user").slice(1), icon: "🎖️" },
    { label: "Member Since", value: joinDate, icon: "📅" },
    { label: "Location", value: user.location ? "📍 Location saved" : "Not configured", icon: "📍" },
  ];

  const quickActions = [
    { label: "My Books", desc: "View & manage your listings", icon: "📚", color: "#7c3aed", path: "/my-books" },
    { label: "Activity", desc: "Track rentals & transactions", icon: "📋", color: "#0ea5e9", path: "/activity" },
    { label: "Events", desc: "Browse upcoming events", icon: "🎉", color: "#10b981", path: "/events" },
    { label: "Libraries", desc: "Find nearby libraries", icon: "🏛️", color: "#f59e0b", path: "/libraries" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .profile-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .profile-stat-card:hover { transform: translateY(-6px) !important; }
        .profile-action-card:hover { transform: translateY(-4px) scale(1.01) !important; border-color: var(--hov) !important; }
        .profile-tab:hover { background: rgba(124,58,237,0.08); }
        .profile-info-row:hover { background: rgba(124,58,237,0.04) !important; }
        .skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
      `}</style>

      <div className="profile-root" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)", padding: "32px 28px 80px", display: "flex", flexDirection: "column", gap: 28, animation: "fadeUp .4s ease" }}>

        {/* ── HERO BANNER ── */}
        <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)", padding: "40px 40px 32px", boxShadow: "0 20px 60px rgba(79,70,229,0.35)" }}>
          {/* decorative blobs */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(168,85,247,0.2)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -30, left: 100, width: 150, height: 150, borderRadius: "50%", background: "rgba(99,102,241,0.25)", filter: "blur(30px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 900, color: "white", boxShadow: "0 0 0 4px rgba(255,255,255,0.15), 0 12px 32px rgba(124,58,237,0.5)" }}>
                {initials}
              </div>
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: "#10b981", border: "3px solid #1e1b4b", boxShadow: "0 2px 8px rgba(16,185,129,0.5)" }} />
            </div>

            {/* Name & info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>{user.name || user.username}</h1>
                <span style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.5)", color: "#e9d5ff", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{user.role || "User"}</span>
              </div>
              <p style={{ margin: "0 0 12px", color: "rgba(196,181,253,0.85)", fontSize: 14 }}>@{user.username} · {user.email}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[{ icon: "📅", text: joinDate }, { icon: "📍", text: user.location ? "Location set" : "No location" }, { icon: "🔖", text: `${stats.booksShared ?? "—"} books listed` }].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(196,181,253,0.75)", fontSize: 13 }}>
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <button onClick={() => navigate("/location-setup")} style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                📍 Update Location
              </button>
              <button onClick={handleLogout} style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.28)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {statCards.map(s => (
            <div key={s.label} className="profile-stat-card" style={{ background: "white", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", transition: "transform 0.25s, box-shadow 0.25s", cursor: "default", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 40px ${s.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.gradient, borderRadius: "20px 20px 0 0" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 6px 16px ${s.glow}` }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", marginBottom: 4, lineHeight: 1 }}>
                {s.value === null
                  ? <div className="skeleton" style={{ width: 40, height: 32 }} />
                  : s.value}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 4, background: "white", padding: 4, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", width: "fit-content", border: "1px solid rgba(0,0,0,0.04)" }}>
          {["overview", "account"].map(tab => (
            <button key={tab} className="profile-tab" onClick={() => setActiveTab(tab)}
              style={{ padding: "9px 22px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s", textTransform: "capitalize", letterSpacing: "0.01em", background: activeTab === tab ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "transparent", color: activeTab === tab ? "white" : "#64748b", boxShadow: activeTab === tab ? "0 4px 12px rgba(124,58,237,0.35)" : "none" }}>
              {tab === "overview" ? "🗂 Overview" : "⚙️ Account"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Quick Actions */}
            <div style={{ background: "white", borderRadius: 24, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>⚡ Quick Navigation</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {quickActions.map(a => (
                  <div key={a.label} className="profile-action-card" onClick={() => navigate(a.path)} style={{ "--hov": a.color + "30", display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", transition: "all 0.2s", background: "rgba(248,250,252,0.8)" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: a.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{a.desc}</div>
                    </div>
                    <div style={{ color: a.color, fontSize: 18, fontWeight: 700 }}>›</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Summary */}
            <div style={{ background: "white", borderRadius: 24, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>📊 Activity Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Books in Library", val: stats.booksShared, max: Math.max(stats.booksShared || 0, 10), color: "#7c3aed" },
                  { label: "Active Rentals", val: stats.activeRentals, max: Math.max(stats.activeRentals || 0, 10), color: "#0ea5e9" },
                  { label: "Completed Deals", val: stats.transactions, max: Math.max(stats.transactions || 0, 10), color: "#10b981" },
                  { label: "Events Attended", val: stats.eventsJoined, max: Math.max(stats.eventsJoined || 0, 10), color: "#f59e0b" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
                        {item.val === null ? <span className="skeleton" style={{ width: 20, height: 14, display: "inline-block" }} /> : item.val}
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 8, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 8, background: item.color, width: item.val === null ? "0%" : `${Math.min((item.val / item.max) * 100, 100)}%`, transition: "width 1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 2px 8px ${item.color}60` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* membership badge */}
              <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(168,85,247,0.06))", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌟</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#7c3aed" }}>Community Member</div>
                  <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 1 }}>Joined {joinDate}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === "account" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Account Info */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Personal Information</h3>
              </div>
              <div>
                {infoItems.map((row, i) => (
                  <div key={row.label} className="profile-info-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 24px", borderBottom: i < infoItems.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16, opacity: 0.7 }}>{row.icon}</span>
                      <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 14, color: "#1e293b", fontWeight: 600, maxWidth: "55%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Location card */}
              <div style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📍</div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Location Settings</h3>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                  {user.location ? "Your location is saved. Update it anytime to get better nearby recommendations." : "No location set. Add your location to discover nearby libraries and events."}
                </p>
                <button onClick={() => navigate("/location-setup")} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 16px rgba(14,165,233,0.35)", transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  📍 {user.location ? "Update Location" : "Set Location"}
                </button>
              </div>

              {/* Danger Zone */}
              <div style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚠️</div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Account Actions</h3>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                  Signing out will end your current session. You can always log back in with your credentials.
                </p>
                <button onClick={handleLogout} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
