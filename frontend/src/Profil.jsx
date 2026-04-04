import { useState } from "react";
import Header from "./Header.jsx";

const Profil = () => {
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const styles = {
    page: {
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      width: "100%",
      minHeight: "100vh",
      background: "#ffffff",
      color: "#1a1a1a",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
    },

    /* ── Banner ── */
    banner: {
      width: "100%",
      height: 260,
      background: "linear-gradient(135deg, #5a5a5a 0%, #787878 50%, #5a5a5a 100%)",
    },

    /* ── Main content wrapper ── */
    contentWrapper: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "0 40px",
      position: "relative",
    },

    /* ── Avatar row ── */
    avatarRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    avatarWrapper: {
      position: "relative",
      marginTop: -55,
      width: 130,
      height: 130,
      flexShrink: 0,
    },
    avatar: {
      width: 130,
      height: 130,
      borderRadius: "50%",
      background: "#d4d4d4",
      border: "5px solid #ffffff",
      objectFit: "cover",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    },
    onlineIndicator: {
      position: "absolute",
      bottom: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#2dd4a8",
      border: "3.5px solid #ffffff",
    },

    /* ── Badge ── */
    availableBadge: {
      marginTop: 16,
      background: "linear-gradient(135deg, #6366f1, #22d3ee)",
      color: "#ffffff",
      fontSize: 13,
      fontWeight: 600,
      padding: "8px 20px",
      borderRadius: 8,
      letterSpacing: 0.3,
      whiteSpace: "nowrap",
    },

    /* ── Info ── */
    infoSection: {
      paddingTop: 20,
    },
    name: {
      fontSize: 30,
      fontWeight: 700,
      margin: "0 0 4px 0",
      color: "#1a1a1a",
      letterSpacing: -0.3,
    },
    title: {
      fontSize: 16,
      fontWeight: 500,
      color: "#444444",
      margin: "0 0 6px 0",
    },
    location: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 14,
      color: "#666666",
      margin: "0 0 24px 0",
    },

    /* ── Buttons ── */
    actionRow: {
      display: "flex",
      gap: 14,
      marginBottom: 24,
    },
    btnOutline: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 22px",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      background: "#ffffff",
      fontSize: 14,
      fontWeight: 500,
      color: "#1a1a1a",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    btnOutlineHover: {
      background: "#eeeeee",
      borderColor: "#b0b0b0",
    },

    /* ── Skills ── */
    skillsRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      paddingBottom: 32,
    },
    skillTag: {
      padding: "7px 18px",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 500,
      color: "#1a1a1a",
      background: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    },

    /* ── Divider ── */
    divider: {
      width: "100%",
      height: 1,
      background: "#e0e0e0",
    },

    /* ── Bottom Cards ── */
    bottomSection: {
      padding: "48px 0 60px 0",
    },
    cardRow: {
      display: "flex",
      gap: 0,
      border: "1.5px solid #d1d5db",
      borderRadius: 14,
      overflow: "hidden",
      background: "#ffffff",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    },
    card: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "22px 24px",
      background: "#ffffff",
      cursor: "pointer",
      transition: "background 0.2s ease",
      borderRight: "1.5px solid #e5e7eb",
    },
    cardHover: {
      background: "#f4f4f5",
    },
    cardLast: {
      borderRight: "none",
    },
    cardIcon: {
      width: 30,
      height: 30,
      color: "#555555",
      flexShrink: 0,
    },
    cardTextGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: "#1a1a1a",
      lineHeight: 1.3,
    },
    cardSub: {
      fontSize: 13,
      color: "#888888",
      lineHeight: 1.4,
    },
  };

  const skills = ["React", "TypeScript", "Next.js", "UI/UX", "Tailwind CSS"];

  const bottomCards = [
    {
      id: "ready",
      icon: (
        <svg style={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a4 4 0 0 0-8 0v2" />
        </svg>
      ),
      title: "Ready for work",
      sub: "Update your availability status",
    },
    {
      id: "share",
      icon: (
        <svg style={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
      title: "Share your profile",
      sub: "Share your profile with others",
    },
    {
      id: "update",
      icon: (
        <svg style={styles.cardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      title: "Update Profile",
      sub: "Keep your info current",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Banner full width */}
      <div style={styles.banner} />

      {/* Centered content */}
      <div style={styles.contentWrapper}>
        {/* Avatar + Badge */}
        <div style={styles.avatarRow}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatar} />
            <div style={styles.onlineIndicator} />
          </div>
          <div style={styles.availableBadge}>Available for work</div>
        </div>

        {/* Info */}
        <div style={styles.infoSection}>
          <h1 style={styles.name}>Alex Thompson</h1>
          <p style={styles.title}>Senior Frontend Engineer</p>
          <p style={styles.location}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            San Francisco, CA
          </p>

          {/* Buttons */}
          <div style={styles.actionRow}>
            <button
              style={{ ...styles.btnOutline, ...(hoveredBtn === "edit" ? styles.btnOutlineHover : {}) }}
              onMouseEnter={() => setHoveredBtn("edit")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit profile
            </button>
            <button
              style={{ ...styles.btnOutline, ...(hoveredBtn === "settings" ? styles.btnOutlineHover : {}) }}
              onMouseEnter={() => setHoveredBtn("settings")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Skills */}
          <div style={styles.skillsRow}>
            {skills.map((skill) => (
              <span key={skill} style={styles.skillTag}>{skill}</span>
            ))}
          </div>

          <div style={styles.divider} />
        </div>

        {/* Bottom Cards */}
        <div style={styles.bottomSection}>
          <div style={styles.cardRow}>
            {bottomCards.map((card, i) => (
              <div
                key={card.id}
                style={{
                  ...styles.card,
                  ...(i === bottomCards.length - 1 ? styles.cardLast : {}),
                  ...(hoveredCard === card.id ? styles.cardHover : {}),
                }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {card.icon}
                <div style={styles.cardTextGroup}>
                  <span style={styles.cardTitle}>{card.title}</span>
                  <span style={styles.cardSub}>{card.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
