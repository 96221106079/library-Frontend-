// ============================================
// EventsPage.jsx - Premium Community Events
// ============================================
import React, { useState, useEffect, useRef } from "react";
import { eventAPI, userAPI, libraryAPI } from "../services/api";
import styles from "./EventsPage.module.css";

const DEMO_EVENTS = [
  {
    _id: "demo-1",
    title: "Reading Competition",
    description: "Compete with top readers in speed reading, comprehension, and literary trivia.",
    category: "Competitions",
    dateTime: "2026-06-15T10:30:00.000Z",
    venue: "Central Smart Library Hall",
    libraryName: "City Smart Library",
    organizerName: "City Literacy Council",
    maxAttendees: 120,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1455885666463-5e666ea8d4ad?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "2.4 km",
  },
  {
    _id: "demo-2",
    title: "Book Fair 2026",
    description: "Discover new releases, second-hand gems, and meet local publishers.",
    category: "Book Fair",
    dateTime: "2026-07-03T09:00:00.000Z",
    venue: "Exhibition Ground, Sector 9",
    libraryName: "Metro Public Library",
    organizerName: "Book Fair Society",
    maxAttendees: 500,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "4.8 km",
  },
  {
    _id: "demo-3",
    title: "Library Workshop",
    description: "Hands-on workshop on cataloging, digital archives, and library automation.",
    category: "Workshops",
    dateTime: "2026-06-27T14:00:00.000Z",
    venue: "Knowledge Hub Lab",
    libraryName: "Knowledge Hub Library",
    organizerName: "Library Innovation Team",
    maxAttendees: 90,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "1.9 km",
  },
  {
    _id: "demo-4",
    title: "Coding Seminar",
    description: "Learn AI-assisted coding workflows and modern full-stack architecture patterns.",
    category: "Coding",
    dateTime: "2026-06-22T16:30:00.000Z",
    venue: "Tech Auditorium",
    libraryName: "Digital Learning Center",
    organizerName: "Code Mentor Group",
    maxAttendees: 180,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "6.1 km",
  },
  {
    _id: "demo-5",
    title: "Author Meetup",
    description: "Meet bestselling authors, ask questions, and get signed copies.",
    category: "Reading",
    dateTime: "2026-07-10T18:00:00.000Z",
    venue: "Readers Arena",
    libraryName: "Writers Circle Library",
    organizerName: "Authors Guild",
    maxAttendees: 220,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "3.3 km",
  },
  {
    _id: "demo-6",
    title: "Story Writing Contest",
    description: "Pitch your original story idea and compete for publication opportunities.",
    category: "Seminars",
    dateTime: "2026-06-30T11:15:00.000Z",
    venue: "Creative Studio Hall",
    libraryName: "Creative Minds Library",
    organizerName: "Story Labs",
    maxAttendees: 150,
    attendees: [],
    banner:
      "https://images.unsplash.com/photo-1473755504818-b72b6dfdc226?auto=format&fit=crop&w=1200&q=80",
    distanceLabel: "5.5 km",
  },
];

const normalizeCategory = (cat = "") => {
  const lower = cat.toLowerCase();
  if (lower.includes("workshop")) return "Workshops";
  if (lower.includes("coding")) return "Coding";
  if (lower.includes("seminar")) return "Seminars";
  if (lower.includes("fair")) return "Book Fair";
  if (lower.includes("competition")) return "Competitions";
  return "Reading";
};

const seededRegistrations = (id) => {
  const digits = String(id)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return 60 + (digits % 170);
};

// ── Countdown Timer Component ───────────────────────────────────────────────
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        ended: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.ended) {
    return <span className={styles.countdownLive}>⚡ Active / Concluded</span>;
  }

  return (
    <div className={styles.countdownContainer}>
      <span className={styles.countdownLabel}>Starts in:</span>
      <div className={styles.countdownTimer}>
        {timeLeft.days > 0 && (
          <span className={styles.countdownUnit}>{timeLeft.days}d</span>
        )}
        <span className={styles.countdownUnit}>{timeLeft.hours}h</span>
        <span className={styles.countdownUnit}>{timeLeft.minutes}m</span>
        <span className={styles.countdownUnit}>{timeLeft.seconds}s</span>
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const EventsPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all", "Reading competition", "Workshop", "Seminar", "Book fair", "Coding event"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Location details
  const [userCoords, setUserCoords] = useState(null);
  const [libraries, setLibraries] = useState([]);

  // Librarian states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myOrganizedEvents, setMyOrganizedEvents] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "Reading competition",
    dateTime: "",
    venue: "",
    banner: "",
    libraryId: "",
    libraryName: "",
    maxAttendees: 50,
    lat: "",
    lng: "",
  });
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [demoRegisteredIds, setDemoRegisteredIds] = useState(new Set());

  // ── Registration modal (validated inputs) ──
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerEventId, setRegisterEventId] = useState(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "" });
  const [registerError, setRegisterError] = useState("");

  const openRegistrationModal = (eventId) => {
    const first = currentUser?.firstName || "";
    const last = currentUser?.lastName || "";
    const fallbackName = currentUser?.username || "";
    const fullName = currentUser?.name || `${first} ${last}`.trim() || fallbackName;
    setRegisterForm({
      fullName,
      email: currentUser?.email || "",
    });
    setRegisterError("");
    setRegisterEventId(eventId);
    setRegisterModalOpen(true);
  };

  const validateRegistrationForm = () => {
    const name = (registerForm.fullName || "").trim();
    const email = (registerForm.email || "").trim();

    if (!name || name.length < 3) {
      return "Please enter a valid full name (min 3 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    const msg = validateRegistrationForm();
    if (msg) {
      setRegisterError(msg);
      return;
    }
    setRegisterSubmitting(true);
    setRegisterError("");
    try {
      const ok = await handleJoinEvent(registerEventId, registerForm);
      if (!ok) {
        setRegisterError("Registration failed. Please try again.");
        setRegisterSubmitting(false);
        return;
      }
      setRegisterModalOpen(false);
      setRegisterEventId(null);
    } catch (err) {
      setRegisterError(err?.message || "Registration failed. Please try again.");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Initial loads
  useEffect(() => {
    const fetchUserAndCoords = async () => {
      try {
        const uRes = await userAPI.getProfile();
        const user = uRes.data.user;
        setCurrentUser(user);

        // Fallback user coords
        if (user.location && user.location.coordinates && user.location.coordinates[0] !== 0) {
          setUserCoords({
            lng: user.location.coordinates[0],
            lat: user.location.coordinates[1],
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    fetchUserAndCoords();
  }, []);

  // Request browser geolocation to get the most accurate location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation permission denied, using profile location or defaults.", err);
        }
      );
    }
  }, []);

  // Fetch libraries for dropdown when creating event
  useEffect(() => {
    const fetchLibraries = async () => {
      if (currentUser?.role === "librarian" && userCoords) {
        try {
          const res = await libraryAPI.getNearby(userCoords.lat, userCoords.lng, 50);
          if (res.data.success) {
            setLibraries(res.data.libraries || []);
            // Pre-select first library
            if (res.data.libraries?.length > 0) {
              const mainLib = res.data.libraries[0];
              setCreateForm(prev => ({
                ...prev,
                libraryId: mainLib._id,
                libraryName: mainLib.name,
                lat: mainLib.location?.coordinates?.[1] || userCoords.lat,
                lng: mainLib.location?.coordinates?.[0] || userCoords.lng,
              }));
            }
          }
        } catch (e) {
          console.error("Failed to fetch libraries", e);
        }
      }
    };

    fetchLibraries();
  }, [currentUser, userCoords]);

  // Main data sync
  const syncData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.radius = 25; // 25km radius
      }

      // Fetch all upcoming events (optionally sorted by location distance)
      const res = await eventAPI.getAll(params);
      if (res.data.success) {
        setEvents(res.data.events || []);
      }

      // Fetch my registered events
      const myRes = await eventAPI.getAll({ myEvents: "true" });
      if (myRes.data.success) {
        setMyEvents(myRes.data.events || []);
      }

      // If librarian, fetch organized events
      if (currentUser?.role === "librarian" || currentUser?.role === "admin") {
        const organizedRes = await eventAPI.getAll({ myOrganized: "true" });
        if (organizedRes.data.success) {
          setMyOrganizedEvents(organizedRes.data.events || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sync community events registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData();
  }, [currentUser, userCoords]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % DEMO_EVENTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Join handler
  const handleJoinEvent = async (eventId, formData = {}) => {
    if (String(eventId).startsWith("demo-")) {
      setDemoRegisteredIds((prev) => new Set([...prev, eventId]));
      setSuccessMessage("Registered successfully!");
      if (selectedEvent && selectedEvent._id === eventId) {
        setSelectedEvent({ ...selectedEvent });
      }
      return true;
    }
    try {
      const res = await eventAPI.join(eventId, formData);
      if (res.data.success) {
        setSuccessMessage(res.data.message || "Registered successfully!");
        syncData();
        // Update detail modal state
        if (selectedEvent && selectedEvent._id === eventId) {
          const updatedEvent = {
            ...selectedEvent,
            attendees: [...selectedEvent.attendees, { 
              userId: currentUser.id || currentUser._id, 
              fullName: formData.fullName, 
              email: formData.email 
            }]
          };
          setSelectedEvent(updatedEvent);
        }
        return true;
      }
      setError(res.data.message || "Registration failed.");
      return false;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
      return false;
    }
  };

  // Leave handler
  const handleLeaveEvent = async (eventId) => {
    if (String(eventId).startsWith("demo-")) {
      setDemoRegisteredIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setSuccessMessage("Registration cancelled successfully.");
      return;
    }
    try {
      const res = await eventAPI.leave(eventId);
      if (res.data.success) {
        setSuccessMessage("Registration cancelled successfully.");
        syncData();
        // Update detail modal state
        if (selectedEvent && selectedEvent._id === eventId) {
          const updatedEvent = {
            ...selectedEvent,
            attendees: selectedEvent.attendees.filter(att => (att.userId || att) !== (currentUser.id || currentUser._id))
          };
          setSelectedEvent(updatedEvent);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Cancellation failed.");
    }
  };

  // Librarian Event Delete
  const handleDeleteEvent = async (eventId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel and delete this community event?")) return;
    try {
      const res = await eventAPI.delete(eventId);
      if (res.data.success) {
        setSuccessMessage("Event cancelled and removed.");
        syncData();
        if (selectedEvent?._id === eventId) {
          setSelectedEvent(null);
        }
      }
    } catch (err) {
      setError("Failed to cancel event.");
    }
  };

  // Create Event Form Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.description || !createForm.venue || !createForm.dateTime) {
      return setError("Please complete all required fields.");
    }

    try {
      // Find selected library object for location fallback if not manual
      let lat = createForm.lat;
      let lng = createForm.lng;

      if (!lat || !lng) {
        if (userCoords) {
          lat = userCoords.lat;
          lng = userCoords.lng;
        } else {
          lat = 28.6139; // Delhi center default
          lng = 77.2090;
        }
      }

      const postData = {
        ...createForm,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };

      const res = await eventAPI.create(postData);
      if (res.data.success) {
        setSuccessMessage("Event published successfully! 🎉");
        setShowCreateModal(false);
        setCreateForm({
          title: "",
          description: "",
          category: "Reading competition",
          dateTime: "",
          venue: "",
          banner: "",
          libraryId: libraries[0]?._id || "",
          libraryName: libraries[0]?.name || "",
          maxAttendees: 50,
          lat: libraries[0]?.location?.coordinates?.[1] || userCoords?.lat || "",
          lng: libraries[0]?.location?.coordinates?.[0] || userCoords?.lng || "",
        });
        syncData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish event.");
    }
  };

  // Pre-fill creation defaults on modal open
  const openCreateModal = () => {
    if (libraries.length > 0) {
      const lib = libraries[0];
      setCreateForm(prev => ({
        ...prev,
        libraryId: lib._id,
        libraryName: lib.name,
        lat: lib.location?.coordinates?.[1] || userCoords?.lat || "",
        lng: lib.location?.coordinates?.[0] || userCoords?.lng || "",
      }));
    } else if (userCoords) {
      setCreateForm(prev => ({
        ...prev,
        lat: userCoords.lat,
        lng: userCoords.lng,
      }));
    }
    setShowCreateModal(true);
  };

  // Filter Categories definitions
  const categories = [
    { id: "all", label: "All" },
    { id: "Reading", label: "Reading" },
    { id: "Workshops", label: "Workshops" },
    { id: "Coding", label: "Coding" },
    { id: "Seminars", label: "Seminars" },
    { id: "Book Fair", label: "Book Fair" },
    { id: "Competitions", label: "Competitions" },
  ];

  // Filters computed events
  const filteredLiveEvents = events.filter((e) => {
    const normalized = normalizeCategory(e.category);
    const matchesTab = activeTab === "all" || normalized === activeTab;
    const matchesSearch =
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.libraryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      normalized.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const filteredDemoEvents = DEMO_EVENTS.filter((e) => {
    const normalized = normalizeCategory(e.category);
    const matchesTab = activeTab === "all" || normalized === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.libraryName.toLowerCase().includes(q) ||
      normalized.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const displayEvents = filteredLiveEvents.length > 0 ? filteredLiveEvents : filteredDemoEvents;
  const featuredEvent = DEMO_EVENTS[featuredIndex];
  const joinedToday = 10 + ((new Date().getDate() + featuredIndex) % 13);

  // Merge backend myEvents with locally-registered demo events
  const demoMyEvents = DEMO_EVENTS.filter(e => demoRegisteredIds.has(e._id));
  const allMyEvents = [...myEvents, ...demoMyEvents.filter(de => !myEvents.some(me => me._id === de._id))];

  return (
    <div className={styles.pageContainer}>
      {/* 🚀 TOAST NOTIFICATIONS */}
      {successMessage && (
        <div className={styles.toastSuccess}>
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className={styles.toastError}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* 🌟 PREMIUM GRAPHICS GLOW */}
      <div className={styles.bgGlowPurple}></div>
      <div className={styles.bgGlowTeal}></div>

      {/* ── HEADER BANNER ── */}
      <header className={styles.heroHeader}>
        <div className={styles.heroOverlay}>
          <span className={styles.heroTagline}>Connect • Learn • Share</span>
          <h1 className={styles.heroTitle}>🎉 Community Hub & Events</h1>
          <p className={styles.heroDesc}>
            Join immersive workshops, reading challenges, and networking panels.
            Explore nearby programs facilitated by smart libraries near you.
          </p>
          <div className={styles.searchBarWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search events by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className={styles.showcaseSection}>
        <div className={styles.featuredCarousel}>
          <div
            className={styles.featuredBanner}
            style={{ backgroundImage: `url(${featuredEvent.banner})` }}
          >
            <div className={styles.featuredOverlay}>
              <span className={styles.trendingBadge}>🔥 Trending in your city</span>
              <h3>{featuredEvent.title}</h3>
              <p>{featuredEvent.venue} • {new Date(featuredEvent.dateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              <button
                className={styles.joinBtnFull}
                onClick={() => openRegistrationModal(featuredEvent._id)}
              >
                {demoRegisteredIds.has(featuredEvent._id) ? "Registered" : "Register Now"}
              </button>
            </div>
          </div>
          <div className={styles.featuredDots}>
            {DEMO_EVENTS.map((evt, idx) => (
              <button
                key={evt._id}
                className={`${styles.dot} ${idx === featuredIndex ? styles.dotActive : ""}`}
                onClick={() => setFeaturedIndex(idx)}
              />
            ))}
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span>Upcoming Events</span>
            <strong>{displayEvents.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Events Near You</span>
            <strong>{displayEvents.filter((e) => !!e.distanceLabel).length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Users joined today</span>
            <strong>{joinedToday}</strong>
          </div>
        </div>
      </section>

      {/* ── MY EVENTS CAROUSEL (IF ANY) ── */}
      {allMyEvents.length > 0 && (
        <section className={styles.registeredSection}>
          <div className={styles.sectionHeader}>
            <h2>🎟️ My Registered Passes ({allMyEvents.length})</h2>
            <p>You are officially booked. Renders active passes and countdown trackers.</p>
          </div>
          <div className={styles.myEventsGrid}>
            {allMyEvents.map((evt) => (
              <div
                key={evt._id}
                className={styles.myEventCard}
                onClick={() => setSelectedEvent(evt)}
              >
                <div
                  className={styles.myCardBanner}
                  style={{ backgroundImage: `url(${evt.banner})` }}
                >
                  <span className={styles.categoryBadge}>{evt.category}</span>
                </div>
                <div className={styles.myCardContent}>
                  <h3>{evt.title}</h3>
                  <p className={styles.myCardTime}>
                    📅 {new Date(evt.dateTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <p className={styles.myCardVenue}>📍 {evt.venue}</p>
                  <div className={styles.myCardFooter}>
                    <CountdownTimer targetDate={evt.dateTime} />
                    <button
                      className={styles.leaveBtnMini}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveEvent(evt._id);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── LIBRARIAN PANEL CONTROL ── */}
      {(currentUser?.role === "librarian" || currentUser?.role === "admin") && (
        <section className={styles.librarianPanel}>
          <div className={styles.libPanelHeader}>
            <div>
              <h2>🏛️ Staff Management Portal</h2>
              <p>Publish, update, or cancel engagement programs organized by your library node.</p>
            </div>
            <button className={styles.createEventBtn} onClick={openCreateModal}>
              ➕ Host New Event
            </button>
          </div>

          {myOrganizedEvents.length > 0 ? (
            <div className={styles.organizedGrid}>
              {myOrganizedEvents.map((evt) => (
                <div key={evt._id} className={styles.organizedRow} onClick={() => setSelectedEvent(evt)}>
                  <span className={styles.orgCategory}>{evt.category}</span>
                  <div className={styles.orgMainInfo}>
                    <strong>{evt.title}</strong>
                    <span>{evt.venue} • {new Date(evt.dateTime).toLocaleString([], { dateStyle: "short" })}</span>
                  </div>
                  <div className={styles.orgAttendees}>
                    👥 {evt.attendees?.length || 0} / {evt.maxAttendees} Booked
                  </div>
                  <button
                    className={styles.cancelEventBtn}
                    onClick={(e) => handleDeleteEvent(evt._id, e)}
                  >
                    🗑️ Cancel
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.libEmptyState}>
              <p>You haven't hosted any community event yet. Click "Host New Event" to publish one!</p>
            </div>
          )}
        </section>
      )}

      {/* ── CATEGORY FILTER TABS ── */}
      <nav className={styles.filterTabs}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.tabBtn} ${activeTab === cat.id ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* ── MAIN DISCOVERY & PROXIMITY GRID ── */}
      <main className={styles.mainFeed}>
        <div className={styles.feedHeader}>
          <h2>
            {activeTab === "all" ? "🔥 All Active Programs" : `🎯 Category: ${activeTab}`}
          </h2>
          <p>
            {userCoords
              ? "🎯 Near Coordinates (Auto-sorted by geographical proximity)"
              : "🗺️ Turn on device location to calculate nearest smart library nodes."}
          </p>
        </div>

        {loading ? (
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p>Syncing Community Registry...</p>
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {displayEvents.map((evt) => {
              const isDemo = String(evt._id).startsWith("demo-");
              const isJoined = isDemo
                ? demoRegisteredIds.has(evt._id)
                : evt.attendees?.some(att => (att.userId || att) === (currentUser?.id || currentUser?._id));
              const attendeeCount = isDemo
                ? seededRegistrations(evt._id) + (isJoined ? 1 : 0)
                : evt.attendees?.length || 0;
              const spotsLeft = Math.max(0, evt.maxAttendees - (evt.attendees?.length || 0));

              return (
                <article
                  key={evt._id}
                  className={styles.eventCard}
                  onClick={() => setSelectedEvent(evt)}
                >
                  <div
                    className={styles.cardHeader}
                    style={{ backgroundImage: `url(${evt.banner})` }}
                  >
                    <span className={styles.cardCategoryBadge}>{evt.category}</span>
                    {evt.distanceLabel && (
                      <span className={styles.cardProximityBadge}>📍 {evt.distanceLabel} away</span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardLibraryMeta}>
                      📚 Organized by <span>{evt.organizerName || evt.libraryName || "Community Staff"}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{evt.title}</h3>
                    <p className={styles.cardDesc}>
                      {evt.description.slice(0, 110)}
                      {evt.description.length > 110 ? "..." : ""}
                    </p>

                    <div className={styles.cardDateTimeLoc}>
                      <div>
                        📅 {new Date(evt.dateTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </div>
                      <div>🏢 {evt.venue}</div>
                    </div>

                    <CountdownTimer targetDate={evt.dateTime} />

                    <div className={styles.cardFooter}>
                      <span className={styles.capacityMetric}>
                        👤 {attendeeCount} / {evt.maxAttendees} Spots Taken
                      </span>
                      <div className={styles.inlineActions}>
                        <button
                          className={styles.joinBtnMini}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isJoined) openRegistrationModal(evt._id);
                          }}
                          disabled={isJoined}
                        >
                          {isJoined ? "Registered" : "Register Now"}
                        </button>
                        <button
                          className={styles.viewBtnMini}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── MODAL 1: EVENT DETAILS MODAL ── */}
      {selectedEvent && (() => {
        const isJoined = String(selectedEvent._id).startsWith("demo-")
          ? demoRegisteredIds.has(selectedEvent._id)
          : selectedEvent.attendees?.some(att => (att.userId || att) === (currentUser?.id || currentUser?._id));
        const spotsLeft = Math.max(0, selectedEvent.maxAttendees - (selectedEvent.attendees?.length || 0));
        return (
          <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
            <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeBtn} onClick={() => setSelectedEvent(null)}>
                ✕
              </button>

              <div
                className={styles.modalBanner}
                style={{ backgroundImage: `url(${selectedEvent.banner})` }}
              >
                <span className={styles.modalCategoryBadge}>{selectedEvent.category}</span>
                {selectedEvent.distanceLabel && (
                  <span className={styles.modalDistanceBadge}>📍 {selectedEvent.distanceLabel} away</span>
                )}
              </div>

              <div className={styles.modalContent}>
                <div className={styles.modalMetaRow}>
                  <div className={styles.modalLibInfo}>
                    📚 Organized by <span>{selectedEvent.libraryName || "Smart Library Network"}</span>
                  </div>
                  <div className={styles.modalCapacity}>
                    👤 {selectedEvent.attendees?.length || 0} / {selectedEvent.maxAttendees} Joined
                  </div>
                </div>

                <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
                
                <p className={styles.modalDesc}>{selectedEvent.description}</p>

                <div className={styles.modalSpecsGrid}>
                  <div className={styles.specBox}>
                    <span className={styles.specLabel}>🕒 WHEN</span>
                    <span className={styles.specVal}>
                      {new Date(selectedEvent.dateTime).toLocaleString([], { dateStyle: "long", timeStyle: "short" })}
                    </span>
                  </div>
                  <div className={styles.specBox}>
                    <span className={styles.specLabel}>🏢 WHERE</span>
                    <span className={styles.specVal}>{selectedEvent.venue}</span>
                  </div>
                </div>

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className={styles.attendeesListSection}>
                    <h3 className={styles.attendeesTitle}>👥 Registered Attendees</h3>
                    <ul className={styles.attendeesList}>
                      {selectedEvent.attendees.map((att, i) => (
                        <li key={att.userId || att._id || i} className={styles.attendeeItem}>
                          {att.fullName || "Anonymous Attendee"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.modalCountdownSection}>
                  <CountdownTimer targetDate={selectedEvent.dateTime} />
                </div>

                <div className={styles.modalActions}>
                  {isJoined ? (
                    <button
                      className={styles.leaveBtnFull}
                      onClick={() => handleLeaveEvent(selectedEvent._id)}
                    >
                      Cancel My Slot Pass
                    </button>
                  ) : spotsLeft === 0 ? (
                    <button className={styles.disabledBtnFull} disabled>
                      Event is Full (Max Capacity Reached)
                    </button>
                  ) : (
                    <button
                      className={styles.joinBtnFull}
                      onClick={() => openRegistrationModal(selectedEvent._id)}
                    >
                      🎟️ Confirm Join Event
                    </button>
                  )}

                  {/* Librarian Host can delete event */}
                  {(currentUser?.id === selectedEvent.organizerId?._id ||
                    currentUser?.id === selectedEvent.organizerId ||
                    currentUser?.role === "admin") && (
                    <button
                      className={styles.deleteBtnFull}
                      onClick={() => handleDeleteEvent(selectedEvent._id)}
                    >
                      🗑️ Cancel & Remove Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 2: HOST EVENT MODAL (LIBRARIAN ONLY) ── */}
      {registerModalOpen && registerEventId && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!registerSubmitting) setRegisterModalOpen(false);
          }}
        >
          <div
            className={styles.createModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => {
                if (!registerSubmitting) setRegisterModalOpen(false);
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {(() => {
              const evt =
                events.find((x) => x._id === registerEventId) ||
                DEMO_EVENTS.find((x) => x._id === registerEventId) ||
                {};
              return (
                <>
                  <h2>🎟️ Register Now</h2>
                  <p className={styles.modalSubtitle}>
                    Confirm your details to join: <strong>{evt.title || "Event"}</strong>
                  </p>
                </>
              );
            })()}

            <form onSubmit={submitRegistration} className={styles.createForm}>
              {registerError && (
                <div className={styles.toastError}>
                  <span>⚠️ {registerError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input
                  type="text"
                  value={registerForm.fullName}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Nivedha Kumar"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                  placeholder="e.g. nivedha@email.com"
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.leaveBtnFull}
                  disabled={registerSubmitting}
                  onClick={() => {
                    if (!registerSubmitting) setRegisterModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.joinBtnFull}
                  disabled={registerSubmitting}
                >
                  {registerSubmitting ? "Registering…" : "Register Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
              ✕
            </button>

            <h2>Host a Smart Community Event 🏛️</h2>
            <p className={styles.modalSubtitle}>
              Create workshops, competitions or fair programs easily. The event will auto-calculate distance for local users.
            </p>

            <form onSubmit={handleCreateSubmit} className={styles.createForm}>
              <div className={styles.formGroup}>
                <label>Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Tech Hackathon, Poetry Slam"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  >
                    <option value="Reading competition">Reading competition</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Book fair">Book fair</option>
                    <option value="Coding event">Coding event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Max Attendees Limit *</label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    required
                    value={createForm.maxAttendees}
                    onChange={(e) => setCreateForm({ ...createForm, maxAttendees: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  placeholder="Explain event agenda, pre-requisites, rewards and schedule..."
                  rows="3"
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.dateTime}
                    onChange={(e) => setCreateForm({ ...createForm, dateTime: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Venue Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Library Hall A, Central Park Gate 2"
                    required
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Select Organizer Library Node *</label>
                <select
                  value={createForm.libraryId}
                  onChange={(e) => {
                    const lib = libraries.find(l => l._id === e.target.value);
                    if (lib) {
                      setCreateForm({
                        ...createForm,
                        libraryId: lib._id,
                        libraryName: lib.name,
                        lat: lib.location?.coordinates?.[1] || "",
                        lng: lib.location?.coordinates?.[0] || "",
                      });
                    } else {
                      setCreateForm({
                        ...createForm,
                        libraryId: e.target.value,
                        libraryName: "OSM Independent Center",
                      });
                    }
                  }}
                >
                  <option value="">-- Choose Library Hub --</option>
                  {libraries.map(lib => (
                    <option key={lib._id} value={lib._id}>{lib.name}</option>
                  ))}
                  <option value="osm">OSM/Independent (Uses Current Coordinates)</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Latitude (Geographic Proximity)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.6139"
                    value={createForm.lat}
                    onChange={(e) => setCreateForm({ ...createForm, lat: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Longitude (Geographic Proximity)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.2090"
                    value={createForm.lng}
                    onChange={(e) => setCreateForm({ ...createForm, lng: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Banner Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.jpg (Auto-selected if empty)"
                  value={createForm.banner}
                  onChange={(e) => setCreateForm({ ...createForm, banner: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.submitBtnFull}>
                🚀 Publish Community Program
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
