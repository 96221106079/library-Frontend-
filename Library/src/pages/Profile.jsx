import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user)
    return (
      <div style={{ padding: "32px", color: "#94a3b8", fontSize: "15px" }}>
        Loading profile...
      </div>
    );

  const initials = (user.name || user.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const infoRows = [
    { label: "Full Name", value: user.name || "—", icon: "👤" },
    { label: "Username", value: `@${user.username || "—"}`, icon: "🏷️" },
    { label: "Email", value: user.email || "—", icon: "📧" },
    { label: "Role", value: (user.role || "user").toUpperCase(), icon: "🎖️" },
    { label: "Location", value: user.location ? "📍 Saved" : "Not set", icon: "📍" },
  ];

  const statCards = [
    { label: "Books Shared", value: "—", icon: "📚", color: "#7c4dff" },
    { label: "Active Rentals", value: "—", icon: "🔑", color: "#00c2ff" },
    { label: "Transactions", value: "—", icon: "💸", color: "#00d084" },
    { label: "Events Joined", value: "—", icon: "🎟️", color: "#f59e0b" },
  ];

  return (
    <div
      style={{
        width: "100%",
        padding: "28px 32px",
        paddingBottom: "80px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}
    >
      {/* ── Page Header ── */}
      <div>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "26px",
            fontWeight: "900",
            background: "linear-gradient(135deg, #a5b4fc 0%, #7c4dff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          👤 My Profile
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          Manage your account information and preferences
        </p>
      </div>

      {/* ── Profile Hero Card + Stats Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Avatar Card */}
        <div
          style={{
            background: "rgba(18,28,48,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c4dff, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "900",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(124,77,255,0.4)",
              border: "3px solid rgba(124,77,255,0.3)",
            }}
          >
            {initials}
          </div>

          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "20px",
                fontWeight: "800",
                color: "#f1f5f9",
              }}
            >
              {user.name || user.username}
            </h2>
            <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: "13px" }}>
              {user.email}
            </p>
            <span
              style={{
                display: "inline-block",
                background: "rgba(124,77,255,0.15)",
                border: "1px solid rgba(124,77,255,0.3)",
                color: "#a78bfa",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {user.role || "user"}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          />

          {/* Quick action buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => navigate("/location-setup")}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                color: "#cbd5e1",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(124,77,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <span>📍 Update GPS Location</span>
              <span style={{ color: "#7c4dff" }}>→</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "14px",
                color: "#f87171",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
            >
              <span>🚪 Sign Out</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Right Column: Stats + Account Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {statCards.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(18,28,48,0.7)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "20px",
                  padding: "20px",
                  textAlign: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = stat.color + "40";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: stat.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    margin: "0 auto 12px",
                  }}
                >
                  {stat.icon}
                </div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "22px",
                    fontWeight: "900",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#64748b",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Account Info Panel */}
          <div
            style={{
              background: "rgba(18,28,48,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>⚙️</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#f1f5f9",
                }}
              >
                Account Settings
              </h3>
            </div>

            <div style={{ padding: "8px 0" }}>
              {infoRows.map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 24px",
                    borderBottom:
                      idx < infoRows.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "16px", opacity: 0.7 }}>
                      {row.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      {row.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#e2e8f0",
                      fontWeight: "500",
                      maxWidth: "55%",
                      textAlign: "right",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive Overrides ── */}
      <style>{`
        @media (max-width: 1024px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .profile-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
