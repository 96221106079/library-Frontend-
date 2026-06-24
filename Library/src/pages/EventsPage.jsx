// ============================================
// EventsPage.jsx - Redesigned Premium Events UI
// ============================================
import React, { useState, useEffect } from "react";
import { eventAPI, userAPI, libraryAPI } from "../services/api";

const DEMO_EVENTS = [
  { _id: "demo-1", title: "Reading Competition", description: "Compete with top readers in speed reading, comprehension, and literary trivia.", category: "Competitions", dateTime: "2026-08-15T10:30:00.000Z", venue: "Central Smart Library Hall", libraryName: "City Smart Library", organizerName: "City Literacy Council", maxAttendees: 120, attendees: [], banner: "https://images.unsplash.com/photo-1455885666463-5e666ea8d4ad?auto=format&fit=crop&w=1200&q=80", distanceLabel: "2.4 km" },
  { _id: "demo-2", title: "Book Fair 2026", description: "Discover new releases, second-hand gems, and meet local publishers.", category: "Book Fair", dateTime: "2026-09-03T09:00:00.000Z", venue: "Exhibition Ground, Sector 9", libraryName: "Metro Public Library", organizerName: "Book Fair Society", maxAttendees: 500, attendees: [], banner: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80", distanceLabel: "4.8 km" },
  { _id: "demo-3", title: "Library Workshop", description: "Hands-on workshop on cataloging, digital archives, and library automation.", category: "Workshops", dateTime: "2026-08-27T14:00:00.000Z", venue: "Knowledge Hub Lab", libraryName: "Knowledge Hub Library", organizerName: "Library Innovation Team", maxAttendees: 90, attendees: [], banner: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80", distanceLabel: "1.9 km" },
  { _id: "demo-4", title: "Coding Seminar", description: "Learn AI-assisted coding workflows and modern full-stack architecture patterns.", category: "Coding", dateTime: "2026-08-22T16:30:00.000Z", venue: "Tech Auditorium", libraryName: "Digital Learning Center", organizerName: "Code Mentor Group", maxAttendees: 180, attendees: [], banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", distanceLabel: "6.1 km" },
  { _id: "demo-5", title: "Author Meetup", description: "Meet bestselling authors, ask questions, and get signed copies.", category: "Reading", dateTime: "2026-09-10T18:00:00.000Z", venue: "Readers Arena", libraryName: "Writers Circle Library", organizerName: "Authors Guild", maxAttendees: 220, attendees: [], banner: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80", distanceLabel: "3.3 km" },
  { _id: "demo-6", title: "Story Writing Contest", description: "Pitch your original story idea and compete for publication opportunities.", category: "Seminars", dateTime: "2026-08-30T11:15:00.000Z", venue: "Creative Studio Hall", libraryName: "Creative Minds Library", organizerName: "Story Labs", maxAttendees: 150, attendees: [], banner: "https://images.unsplash.com/photo-1473755504818-b72b6dfdc226?auto=format&fit=crop&w=1200&q=80", distanceLabel: "5.5 km" },
];

const normalizeCategory = (cat = "") => {
  const l = cat.toLowerCase();
  if (l.includes("workshop")) return "Workshops";
  if (l.includes("coding")) return "Coding";
  if (l.includes("seminar")) return "Seminars";
  if (l.includes("fair")) return "Book Fair";
  if (l.includes("competition")) return "Competitions";
  return "Reading";
};

const CAT_META = {
  "Workshops": { icon: "🔧", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Coding":    { icon: "💻", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  "Seminars":  { icon: "🎙️", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  "Book Fair": { icon: "📚", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  "Competitions": { icon: "🏆", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "Reading":   { icon: "📖", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
};

const CountdownTimer = ({ targetDate }) => {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = +new Date(targetDate) - Date.now();
      if (diff <= 0) return setT({ ended: true });
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor(diff / 3600000) % 24, mins: Math.floor(diff / 60000) % 60, secs: Math.floor(diff / 1000) % 60 });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (t.ended) return <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>⚡ Live / Concluded</span>;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>STARTS IN</span>
      {[{ v: t.days, l: "d" }, { v: t.hours, l: "h" }, { v: t.mins, l: "m" }, { v: t.secs, l: "s" }].filter((x, i) => i > 0 || x.v > 0).map(({ v, l }) => (
        <div key={l} style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800, minWidth: 32, textAlign: "center" }}>{String(v).padStart(2, "0")}{l}</div>
      ))}
    </div>
  );
};

const categories = [
  { id: "all", label: "All Events", icon: "✨" },
  { id: "Reading", label: "Reading", icon: "📖" },
  { id: "Workshops", label: "Workshops", icon: "🔧" },
  { id: "Coding", label: "Coding", icon: "💻" },
  { id: "Seminars", label: "Seminars", icon: "🎙️" },
  { id: "Book Fair", label: "Book Fair", icon: "📚" },
  { id: "Competitions", label: "Competitions", icon: "🏆" },
];

const EventsPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myOrganizedEvents, setMyOrganizedEvents] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [activeSection, setActiveSection] = useState("discover"); // discover | mine
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [demoRegisteredIds, setDemoRegisteredIds] = useState(new Set());
  const [userCoords, setUserCoords] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerEventId, setRegisterEventId] = useState(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "" });
  const [registerError, setRegisterError] = useState("");
  const [createForm, setCreateForm] = useState({ title: "", description: "", category: "Reading competition", dateTime: "", venue: "", banner: "", libraryId: "", libraryName: "", maxAttendees: 50, lat: "", lng: "" });

  useEffect(() => { if (successMessage) { const t = setTimeout(() => setSuccessMessage(""), 4000); return () => clearTimeout(t); } }, [successMessage]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(""), 5000); return () => clearTimeout(t); } }, [error]);
  useEffect(() => { const id = setInterval(() => setFeaturedIndex(i => (i + 1) % DEMO_EVENTS.length), 5000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const r = await userAPI.getProfile();
        const u = r.data.user;
        setCurrentUser(u);
        if (u.location?.coordinates?.[0]) setUserCoords({ lat: u.location.coordinates[1], lng: u.location.coordinates[0] });
      } catch {}
    };
    init();
  }, []);

  const syncData = async () => {
    setLoading(true);
    try {
      const params = userCoords ? { lat: userCoords.lat, lng: userCoords.lng, radius: 25 } : {};
      const [r1, r2] = await Promise.all([eventAPI.getAll(params), eventAPI.getAll({ myEvents: "true" })]);
      if (r1.data.success) setEvents(r1.data.events || []);
      if (r2.data.success) setMyEvents(r2.data.events || []);
      if (currentUser?.role === "librarian") {
        const r3 = await eventAPI.getAll({ myOrganized: "true" });
        if (r3.data.success) setMyOrganizedEvents(r3.data.events || []);
      }
    } catch { setError("Failed to load events."); }
    finally { setLoading(false); }
  };

  useEffect(() => { syncData(); }, [currentUser, userCoords]);

  useEffect(() => {
    if (currentUser?.role === "librarian" && userCoords) {
      libraryAPI.getNearby?.(userCoords.lat, userCoords.lng, 50)?.then(r => { if (r.data.success) setLibraries(r.data.libraries || []); }).catch(() => {});
    }
  }, [currentUser, userCoords]);

  const requestLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      p => setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Location access denied.")
    );
  };

  const handleJoinEvent = async (eventId, formData = {}) => {
    if (String(eventId).startsWith("demo-")) {
      setDemoRegisteredIds(p => new Set([...p, eventId]));
      setSuccessMessage("🎉 Registered successfully!");
      return true;
    }
    try {
      const res = await eventAPI.join(eventId, formData);
      if (res.data.success) { setSuccessMessage(res.data.message || "🎉 Registered successfully!"); syncData(); return true; }
      setError(res.data.message || "Registration failed."); return false;
    } catch (e) { setError(e.response?.data?.message || "Registration failed."); return false; }
  };

  const handleLeaveEvent = async (eventId) => {
    if (String(eventId).startsWith("demo-")) {
      setDemoRegisteredIds(p => { const n = new Set(p); n.delete(eventId); return n; });
      setSuccessMessage("Registration cancelled."); return;
    }
    try {
      const res = await eventAPI.leave(eventId);
      if (res.data.success) { setSuccessMessage("Registration cancelled."); syncData(); if (selectedEvent?._id === eventId) setSelectedEvent(null); }
    } catch (e) { setError(e.response?.data?.message || "Cancellation failed."); }
  };

  const handleDeleteEvent = async (eventId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this event?")) return;
    try {
      const res = await eventAPI.delete(eventId);
      if (res.data.success) { setSuccessMessage("Event removed."); syncData(); if (selectedEvent?._id === eventId) setSelectedEvent(null); }
    } catch { setError("Failed to delete event."); }
  };

  const openRegistrationModal = (eventId) => {
    setRegisterForm({ fullName: currentUser?.name || currentUser?.username || "", email: currentUser?.email || "" });
    setRegisterError(""); setRegisterEventId(eventId); setRegisterModalOpen(true);
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    const name = registerForm.fullName.trim();
    const email = registerForm.email.trim();
    if (name.length < 3) return setRegisterError("Enter a valid full name (min 3 chars).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setRegisterError("Enter a valid email.");
    setRegisterSubmitting(true); setRegisterError("");
    const ok = await handleJoinEvent(registerEventId, registerForm);
    if (!ok) { setRegisterError("Registration failed. Please try again."); }
    else { setRegisterModalOpen(false); setRegisterEventId(null); }
    setRegisterSubmitting(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.description || !createForm.venue || !createForm.dateTime) return setError("Please fill all required fields.");
    try {
      const res = await eventAPI.create({ ...createForm, lat: parseFloat(createForm.lat || userCoords?.lat || 12.9716), lng: parseFloat(createForm.lng || userCoords?.lng || 77.5946) });
      if (res.data.success) { setSuccessMessage("🎉 Event published!"); setShowCreateModal(false); syncData(); }
    } catch (e) { setError(e.response?.data?.message || "Failed to create event."); }
  };

  // Filter logic
  const filterEvents = (list) => list.filter(ev => {
    const cat = normalizeCategory(ev.category);
    const q = searchQuery.toLowerCase();
    return (activeTab === "all" || cat === activeTab) &&
      (!q || ev.title?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q) || ev.venue?.toLowerCase().includes(q));
  });

  const liveFiltered = filterEvents(events);
  const demoFiltered = filterEvents(DEMO_EVENTS);
  const displayEvents = liveFiltered.length > 0 ? liveFiltered : demoFiltered;
  const featuredEvent = DEMO_EVENTS[featuredIndex];
  const demoMyEvents = DEMO_EVENTS.filter(e => demoRegisteredIds.has(e._id));
  const allMyEvents = [...myEvents, ...demoMyEvents.filter(de => !myEvents.some(me => me._id === de._id))];

  // ── Styles inline ──
  const S = {
    page: { minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Inter', sans-serif" },
    hero: { background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%)", padding: "48px 32px 40px", position: "relative", overflow: "hidden" },
    heroContent: { position: "relative", zIndex: 1, maxWidth: 680 },
    searchWrap: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "12px 18px", marginTop: 24, backdropFilter: "blur(10px)" },
    searchInput: { flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 15, "::placeholder": { color: "rgba(255,255,255,0.5)" } },
    locBtn: { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 16, backdropFilter: "blur(8px)", transition: "all .2s" },
  };

  return (
    <div style={S.page}>
      {/* GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .ev-card { transition: transform .25s, box-shadow .25s; cursor: pointer; }
        .ev-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,0.12) !important; }
        .ev-tab { transition: all .2s; }
        .ev-tab:hover { background: rgba(99,102,241,0.08); }
        .ev-btn { transition: all .2s; }
        .ev-btn:hover { opacity: .88; transform: scale(1.01); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        .toast-enter { animation: fadeUp .35s ease; }
        ::placeholder { color: rgba(255,255,255,0.5) !important; }
        input,select,textarea { font-family: 'Inter',sans-serif; }
      `}</style>

      {/* TOASTS */}
      {successMessage && (
        <div className="toast-enter" style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "linear-gradient(135deg,#10b981,#059669)", color: "white", padding: "14px 22px", borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(16,185,129,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="toast-enter" style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", padding: "14px 22px", borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(239,68,68,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── HERO ── */}
      <header style={S.hero}>
        {/* blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(168,85,247,0.2)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: 60, width: 200, height: 200, borderRadius: "50%", background: "rgba(99,102,241,0.2)", filter: "blur(40px)" }} />

        <div style={S.heroContent}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", padding: "5px 14px", borderRadius: 20, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", display: "inline-block", boxShadow: "0 0 8px #a855f7", animation: "spin 2s linear infinite" }} />
            <span style={{ fontSize: 12, color: "#e9d5ff", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE COMMUNITY EVENTS</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1.15 }}>
            Discover Events <br /><span style={{ background: "linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Near You 🎉</span>
          </h1>
          <p style={{ margin: "12px 0 0", color: "rgba(196,181,253,0.85)", fontSize: 15, maxWidth: 500, lineHeight: 1.65 }}>
            Workshops, reading challenges, coding seminars and more — all happening at smart libraries near you.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14, padding: "11px 18px", marginTop: 24, backdropFilter: "blur(10px)" }}>
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 15, fontFamily: "Inter,sans-serif" }}
              placeholder="Search events, categories, venues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16 }}>✕</button>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button className="ev-btn" onClick={requestLocation} style={S.locBtn}>
              📍 Find Events Near Me
            </button>
            {(currentUser?.role === "librarian" || currentUser?.role === "admin") && (
              <button className="ev-btn" onClick={() => setShowCreateModal(true)} style={{ ...S.locBtn, background: "rgba(168,85,247,0.3)", borderColor: "rgba(168,85,247,0.5)" }}>
                ➕ Host New Event
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── FEATURED CAROUSEL ── */}
      <section style={{ padding: "0 28px", marginTop: 28 }}>
        <div style={{ borderRadius: 24, overflow: "hidden", height: 280, position: "relative", backgroundImage: `url(${featuredEvent.banner})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 16px 48px rgba(0,0,0,0.2)", cursor: "pointer" }} onClick={() => setSelectedEvent(featuredEvent)}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.2) 60%,transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.9)", padding: "4px 12px", borderRadius: 20, marginBottom: 10, width: "fit-content" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "white", display: "inline-block" }} />
              <span style={{ color: "white", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em" }}>🔥 FEATURED</span>
            </div>
            <h2 style={{ margin: "0 0 8px", color: "white", fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", maxWidth: 500 }}>{featuredEvent.title}</h2>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>📅 {new Date(featuredEvent.dateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>📍 {featuredEvent.venue}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>👥 {featuredEvent.maxAttendees} spots</span>
            </div>
            <button className="ev-btn" onClick={e => { e.stopPropagation(); openRegistrationModal(featuredEvent._id); }} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "white", color: "#1e1b4b", fontWeight: 800, fontSize: 13, cursor: "pointer", width: "fit-content" }}>
              {demoRegisteredIds.has(featuredEvent._id) ? "✅ Registered" : "🎟️ Register Now"}
            </button>
          </div>
          {/* dots */}
          <div style={{ position: "absolute", bottom: 20, right: 24, display: "flex", gap: 6 }}>
            {DEMO_EVENTS.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setFeaturedIndex(i); }} style={{ width: i === featuredIndex ? 22 : 8, height: 8, borderRadius: 4, border: "none", background: i === featuredIndex ? "white" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all .3s", padding: 0 }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ padding: "20px 28px 0", display: "flex", gap: 16 }}>
        {[
          { icon: "🎪", label: "Total Events", val: displayEvents.length, color: "#6366f1" },
          { icon: "📍", label: "Near You", val: displayEvents.filter(e => !!e.distanceLabel).length, color: "#10b981" },
          { icon: "🎟️", label: "My Registrations", val: allMyEvents.length, color: "#f59e0b" },
          { icon: "👥", label: "Community Size", val: "2.4k+", color: "#a855f7" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "white", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── SECTION TOGGLE ── */}
      {allMyEvents.length > 0 && (
        <div style={{ padding: "20px 28px 0", display: "flex", gap: 4, background: "none" }}>
          {[{ id: "discover", label: "Discover Events", icon: "🔍" }, { id: "mine", label: `My Passes (${allMyEvents.length})`, icon: "🎟️" }].map(s => (
            <button key={s.id} className="ev-tab" onClick={() => setActiveSection(s.id)}
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: activeSection === s.id ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "white", color: activeSection === s.id ? "white" : "#64748b", boxShadow: activeSection === s.id ? "0 4px 12px rgba(99,102,241,0.35)" : "0 1px 4px rgba(0,0,0,0.06)" }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── MY PASSES SECTION ── */}
      {activeSection === "mine" && allMyEvents.length > 0 && (
        <section style={{ padding: "20px 28px 0", animation: "fadeUp .3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {allMyEvents.map(ev => (
              <div key={ev._id} className="ev-card" style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1px solid rgba(99,102,241,0.12)" }} onClick={() => setSelectedEvent(ev)}>
                <div style={{ height: 120, backgroundImage: `url(${ev.banner})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.5),transparent)" }} />
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <span style={{ background: "#6366f1", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{ev.category}</span>
                  </div>
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    <span style={{ background: "#10b981", color: "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>✅ Registered</span>
                  </div>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{ev.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>📅 {new Date(ev.dateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>📍 {ev.venue}</span>
                  </div>
                  <CountdownTimer targetDate={ev.dateTime} />
                  <button className="ev-btn" onClick={e => { e.stopPropagation(); handleLeaveEvent(ev._id); }} style={{ marginTop: 12, width: "100%", padding: "9px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Cancel Registration
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DISCOVER SECTION ── */}
      {activeSection === "discover" && (
        <>
          {/* Category Tabs */}
          <nav style={{ padding: "20px 28px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button key={cat.id} className="ev-tab" onClick={() => setActiveTab(cat.id)}
                style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: activeTab === cat.id ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "white", color: activeTab === cat.id ? "white" : "#64748b", boxShadow: activeTab === cat.id ? "0 4px 12px rgba(99,102,241,0.35)" : "0 1px 4px rgba(0,0,0,0.06)" }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </nav>

          {/* Events Grid */}
          <main style={{ padding: "20px 28px 60px" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 16 }}>
                <div style={{ width: 44, height: 44, border: "4px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                <p style={{ color: "#64748b", fontWeight: 600 }}>Loading events...</p>
              </div>
            ) : displayEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <h3 style={{ color: "#1e293b", fontWeight: 800 }}>No events found</h3>
                <p style={{ color: "#64748b" }}>Try a different category or clear your search.</p>
                <button className="ev-btn" onClick={() => { setSearchQuery(""); setActiveTab("all"); }} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "#6366f1", color: "white", fontWeight: 700, cursor: "pointer" }}>Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 22 }}>
                {displayEvents.map(ev => {
                  const isDemo = String(ev._id).startsWith("demo-");
                  const isJoined = isDemo ? demoRegisteredIds.has(ev._id) : ev.attendees?.some(a => (a.userId || a) === (currentUser?.id || currentUser?._id));
                  const catMeta = CAT_META[normalizeCategory(ev.category)] || CAT_META["Reading"];
                  const spotsLeft = Math.max(0, ev.maxAttendees - (ev.attendees?.length || 0));
                  const pct = Math.min(100, ((ev.attendees?.length || 0) / ev.maxAttendees) * 100);

                  return (
                    <article key={ev._id} className="ev-card" style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.04)" }} onClick={() => setSelectedEvent(ev)}>
                      {/* Banner */}
                      <div style={{ height: 160, backgroundImage: `url(${ev.banner})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.55),transparent 60%)" }} />
                        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
                          <span style={{ background: catMeta.bg, backdropFilter: "blur(8px)", color: catMeta.color, border: `1px solid ${catMeta.color}30`, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{catMeta.icon} {ev.category}</span>
                        </div>
                        {ev.distanceLabel && <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📍 {ev.distanceLabel}</span>}
                        {isJoined && <span style={{ position: "absolute", bottom: 12, right: 12, background: "#10b981", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>✅ Registered</span>}
                      </div>

                      <div style={{ padding: "18px 20px" }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>📚 {ev.organizerName || ev.libraryName || "Community"}</div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.35 }}>{ev.title}</h3>
                        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.description}</p>

                        <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                          <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>📅 {new Date(ev.dateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>🏢 {ev.venue.length > 22 ? ev.venue.slice(0, 22) + "…" : ev.venue}</span>
                        </div>

                        <CountdownTimer targetDate={ev.dateTime} />

                        {/* Capacity bar */}
                        <div style={{ marginTop: 12, marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>CAPACITY</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pct > 80 ? "#ef4444" : "#10b981" }}>{spotsLeft} spots left</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 4, background: "#f1f5f9" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: pct > 80 ? "#ef4444" : "#6366f1", width: `${pct}%`, transition: "width .5s ease" }} />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="ev-btn" onClick={e => { e.stopPropagation(); if (!isJoined && spotsLeft > 0) openRegistrationModal(ev._id); }}
                            disabled={isJoined || spotsLeft === 0}
                            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: isJoined || spotsLeft === 0 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, background: isJoined ? "#f1f5f9" : spotsLeft === 0 ? "#f1f5f9" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: isJoined || spotsLeft === 0 ? "#94a3b8" : "white", boxShadow: isJoined || spotsLeft === 0 ? "none" : "0 4px 12px rgba(99,102,241,0.35)" }}>
                            {isJoined ? "✅ Registered" : spotsLeft === 0 ? "Full" : "Register"}
                          </button>
                          <button className="ev-btn" onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                            style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            Details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (() => {
        const isJoined = String(selectedEvent._id).startsWith("demo-") ? demoRegisteredIds.has(selectedEvent._id) : selectedEvent.attendees?.some(a => (a.userId || a) === (currentUser?.id || currentUser?._id));
        const spotsLeft = Math.max(0, selectedEvent.maxAttendees - (selectedEvent.attendees?.length || 0));
        const catMeta = CAT_META[normalizeCategory(selectedEvent.category)] || CAT_META["Reading"];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedEvent(null)}>
            <div style={{ background: "white", borderRadius: 24, maxWidth: 600, width: "100%", maxHeight: "88vh", overflow: "auto", animation: "slideIn .3s ease", position: "relative" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedEvent(null)} style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

              <div style={{ height: 220, backgroundImage: `url(${selectedEvent.banner})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "24px 24px 0 0", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.7),transparent 50%)", borderRadius: "24px 24px 0 0" }} />
                <div style={{ position: "absolute", bottom: 20, left: 24 }}>
                  <span style={{ background: catMeta.color, color: "white", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{catMeta.icon} {selectedEvent.category}</span>
                </div>
              </div>

              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>📚 {selectedEvent.libraryName || "Smart Library Network"}</div>
                <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{selectedEvent.title}</h2>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{selectedEvent.description}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { icon: "🕒", label: "When", val: new Date(selectedEvent.dateTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) },
                    { icon: "🏢", label: "Venue", val: selectedEvent.venue },
                    { icon: "👥", label: "Attendees", val: `${selectedEvent.attendees?.length || 0} / ${selectedEvent.maxAttendees}` },
                    { icon: "📍", label: "Distance", val: selectedEvent.distanceLabel || "N/A" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{s.icon} {s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <CountdownTimer targetDate={selectedEvent.dateTime} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {isJoined ? (
                    <button className="ev-btn" onClick={() => handleLeaveEvent(selectedEvent._id)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Cancel My Registration
                    </button>
                  ) : spotsLeft === 0 ? (
                    <button disabled style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#94a3b8", fontWeight: 700, fontSize: 14, cursor: "not-allowed" }}>
                      Event is Full
                    </button>
                  ) : (
                    <button className="ev-btn" onClick={() => openRegistrationModal(selectedEvent._id)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
                      🎟️ Register Now
                    </button>
                  )}
                  {(currentUser?.id === selectedEvent.organizerId?._id || currentUser?.id === selectedEvent.organizerId || currentUser?.role === "admin") && (
                    <button className="ev-btn" onClick={() => handleDeleteEvent(selectedEvent._id)} style={{ padding: "13px 18px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── REGISTER MODAL ── */}
      {registerModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { if (!registerSubmitting) setRegisterModalOpen(false); }}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 440, padding: 32, animation: "slideIn .3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>🎟️ Register Now</h2>
              <button onClick={() => { if (!registerSubmitting) setRegisterModalOpen(false); }} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, color: "#64748b" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>
              Confirm your details for: <strong style={{ color: "#1e293b" }}>{(events.find(x => x._id === registerEventId) || DEMO_EVENTS.find(x => x._id === registerEventId))?.title}</strong>
            </p>

            {registerError && <div style={{ background: "#fee2e2", color: "#ef4444", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>⚠️ {registerError}</div>}

            <form onSubmit={submitRegistration} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Full Name *", key: "fullName", type: "text", placeholder: "e.g. Nivetha Suresh" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "e.g. nivetha@email.com" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                  <input type={f.type} value={registerForm[f.key]} onChange={e => setRegisterForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { if (!registerSubmitting) setRegisterModalOpen(false); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={registerSubmitting} className="ev-btn"
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontWeight: 800, cursor: registerSubmitting ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.4)", opacity: registerSubmitting ? 0.7 : 1 }}>
                  {registerSubmitting ? "Registering..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE EVENT MODAL ── */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: 32, animation: "slideIn .3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>🏛️ Host New Event</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, color: "#64748b" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Fill in the details below to publish a new community event.</p>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Event Title *", key: "title", type: "text", placeholder: "e.g. Annual Book Fair 2026" },
                { label: "Venue *", key: "venue", type: "text", placeholder: "e.g. Main Library Hall" },
                { label: "Banner Image URL", key: "banner", type: "text", placeholder: "https://example.com/image.jpg" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                  <input type={f.type} value={createForm[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif" }} />
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description *</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the event, agenda, requirements..." rows={3}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif", resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category *</label>
                  <select value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif", background: "white" }}>
                    <option>Reading competition</option><option>Workshop</option><option>Seminar</option><option>Book fair</option><option>Coding event</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Attendees *</label>
                  <input type="number" min={5} max={1000} value={createForm.maxAttendees} onChange={e => setCreateForm(p => ({ ...p, maxAttendees: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date & Time *</label>
                <input type="datetime-local" value={createForm.dateTime} onChange={e => setCreateForm(p => ({ ...p, dateTime: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif" }} />
              </div>

              {libraries.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Library Node</label>
                  <select value={createForm.libraryId} onChange={e => { const lib = libraries.find(l => l._id === e.target.value); if (lib) setCreateForm(p => ({ ...p, libraryId: lib._id, libraryName: lib.name, lat: lib.location?.coordinates?.[1] || "", lng: lib.location?.coordinates?.[0] || "" })); }}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "Inter,sans-serif", background: "white" }}>
                    <option value="">-- Select Library --</option>
                    {libraries.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="ev-btn" style={{ padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(99,102,241,0.4)", marginTop: 4 }}>
                🚀 Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
