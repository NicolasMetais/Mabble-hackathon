import { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [cards, setCards] = useState([]);
  const [collaborateModal, setCollaborateModal] = useState(null);
  const [requestDesc, setRequestDesc] = useState("");

  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);
  const row4Ref = useRef(null);

  const scroll = (ref, direction) => {
    if (ref.current) {
      const amount = 320;
      ref.current.scrollBy({
        left: direction === "right" ? amount : -amount,
        behavior: "smooth",
      });
    }
  };

  const skills = ["Blender", "Cinema 4D", "Z Brush", "Substance"];
  const filters = ["All Categories", "Any Credits", "Any Rating", "Any Availability"];

  useEffect(() => {
    fetch("http://localhost:4000/services/all")
      .then((res) => res.json())
      .then((data) => {
        const mappedCards = data.map((service) => ({
          id: service.id,
          name: `${service.first_name || "Mabble"} ${service.last_name || "User"}`.trim(),
          role: service.role || "Service Provider",
          bio: service.description || "Creating amazing experiences that wow",
          rating: 5.0,
          reviews: 0,
          amountUSDC: service.amountUSDC || 0,
          amountMBBL: service.amountMBBL || 0,
          available: service.is_active,
          skills: skills,
        }));
        setCards(mappedCards);
      })
      .catch(console.error);
  }, []);

  const rows = [
    { id: "row1", ref: row1Ref, cards },
  ];

  const handleSendRequest = async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        alert("Veuillez vous connecter pour envoyer une demande !");
        return;
      }
      const res = await fetch(`http://localhost:4000/requests/service/${collaborateModal.id}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          description: requestDesc,
          amountMBBL: parseFloat(collaborateModal.amountMBBL) || 0,
          amountUSDC: parseFloat(collaborateModal.amountUSDC) || 0
        })
      });

      if (res.ok) {
        alert("Demande de collaboration envoyée au prestataire !");
        setCollaborateModal(null);
        setRequestDesc("");
      } else {
        const err = await res.json();
        alert("Erreur : " + err.message);
      }
    } catch(e) {
      console.error(e);
      alert("Erreur de connexion serveur.");
    }
  };

  const s = {
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
    inner: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "48px 40px 60px 40px",
    },

    /* ── Header ── */
    heading: {
      fontSize: 42,
      fontWeight: 800,
      margin: "0 0 8px 0",
      letterSpacing: -1,
      textTransform: "uppercase",
      color: "#1a1a1a",
    },
    subtitle: {
      fontSize: 15,
      color: "#666666",
      margin: "0 0 28px 0",
      fontWeight: 400,
    },

    /* ── Search Bar ── */
    searchWrapper: {
      display: "flex",
      alignItems: "center",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      background: "#ffffff",
      padding: "0 16px",
      marginBottom: 24,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    },
    searchIcon: {
      width: 18,
      height: 18,
      color: "#999999",
      flexShrink: 0,
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: 14,
      padding: "14px 0",
      background: "transparent",
      color: "#1a1a1a",
      fontFamily: "inherit",
    },
    searchBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "transparent",
      border: "none",
      fontSize: 14,
      fontWeight: 600,
      color: "#1a1a1a",
      cursor: "pointer",
      padding: "8px 0 8px 12px",
      whiteSpace: "nowrap",
    },

    /* ── Filters ── */
    filterRow: {
      display: "flex",
      gap: 12,
      marginBottom: 32,
      flexWrap: "wrap",
    },
    filterBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 16px",
      border: "1.5px solid #d1d5db",
      borderRadius: 10,
      background: "#ffffff",
      fontSize: 13,
      fontWeight: 500,
      color: "#1a1a1a",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    },

    /* ── Results header ── */
    resultsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 28,
    },
    resultsCount: {
      fontSize: 15,
      fontWeight: 500,
      color: "#555555",
    },
    sortBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "transparent",
      border: "none",
      fontSize: 14,
      fontWeight: 600,
      color: "#1a1a1a",
      cursor: "pointer",
    },

    /* ── Carousel Row ── */
    carouselSection: {
      position: "relative",
      marginBottom: 32,
    },
    carouselTrack: {
      display: "flex",
      gap: 16,
      overflowX: "hidden",
      scrollBehavior: "smooth",
      padding: "4px 0",
    },
    arrowBtn: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "#ffffff",
      border: "1.5px solid #d1d5db",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 2,
      transition: "all 0.2s ease",
    },
    arrowLeft: {
      left: -18,
    },
    arrowRight: {
      right: -18,
    },

    /* ── Card ── */
    card: {
      minWidth: 220,
      maxWidth: 220,
      background: "#ffffff",
      borderRadius: 14,
      border: "1.5px solid #e5e7eb",
      overflow: "hidden",
      flexShrink: 0,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    },
    cardHover: {
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      transform: "translateY(-2px)",
    },
    cardBanner: {
      width: "100%",
      height: 50,
      background: "linear-gradient(135deg, #6b6b6b, #999999)",
      position: "relative",
    },
    cardAvailBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      background: "linear-gradient(135deg, #6366f1, #22d3ee)",
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 6,
    },
    cardBody: {
      padding: "30px 14px 14px 14px",
    },
    cardAvatarRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: -28,
      marginBottom: 10,
    },
    cardAvatar: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "#d4d4d4",
      border: "3px solid #ffffff",
      flexShrink: 0,
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    },
    cardName: {
      fontSize: 14,
      fontWeight: 700,
      color: "#1a1a1a",
      lineHeight: 1.2,
      marginTop: 20,
    },
    cardRole: {
      fontSize: 12,
      color: "#888888",
      fontWeight: 400,
    },
    cardBio: {
      fontSize: 12,
      color: "#666666",
      lineHeight: 1.4,
      margin: "6px 0 10px 0",
    },
    cardSkills: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      marginBottom: 12,
    },
    cardSkillTag: {
      padding: "3px 8px",
      border: "1px solid #d1d5db",
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 500,
      color: "#444444",
      background: "#fafafa",
    },
    cardFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    cardRating: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: "#666666",
    },
    cardStar: {
      color: "#facc15",
      fontSize: 13,
    },
    cardCredits: {
      fontSize: 13,
      fontWeight: 700,
      color: "#1a1a1a",
    },
    cardActions: {
      display: "flex",
      gap: 8,
    },
    btnCollaborate: {
      flex: 1,
      padding: "8px 0",
      border: "1.5px solid #1a1a1a",
      borderRadius: 8,
      background: "#1a1a1a",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      textAlign: "center",
      transition: "all 0.15s ease",
    },
    btnViewProfile: {
      flex: 1,
      padding: "8px 0",
      border: "1.5px solid #d1d5db",
      borderRadius: 8,
      background: "#ffffff",
      color: "#1a1a1a",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      textAlign: "center",
      transition: "all 0.15s ease",
    },
  };

  const ChevronLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
  const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
  const ChevronDown = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const renderCard = (card, rowId) => {
    const key = `${rowId}-${card.id}`;
    const isHovered = hoveredCard === key;
    return (
      <div
        key={key}
        style={{ ...s.card, ...(isHovered ? s.cardHover : {}) }}
        onMouseEnter={() => setHoveredCard(key)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div style={s.cardBanner}>
          <span style={s.cardAvailBadge}>Available</span>
        </div>
        <div style={s.cardBody}>
          <div style={s.cardAvatarRow}>
            <div style={s.cardAvatar} />
            <div>
              <div style={s.cardName}>{card.name}</div>
              <div style={s.cardRole}>{card.role}</div>
            </div>
          </div>
          <div style={s.cardBio}>{card.bio}</div>
          <div style={s.cardSkills}>
            {card.skills.map((sk) => (
              <span key={sk} style={s.cardSkillTag}>{sk}</span>
            ))}
          </div>
          <div style={s.cardFooter}>
            <div style={s.cardRating}>
              <span style={s.cardStar}>★</span>
              {card.rating}{" "}
              <span style={{ color: "#aaa" }}>({card.reviews} reviews)</span>
            </div>
            <div style={s.cardCredits}>{card.amountUSDC} USDC / {card.amountMBBL} MBBL</div>
          </div>
          <div style={s.cardActions}>
            <button
              style={{
                ...s.btnCollaborate,
                ...(hoveredBtn === `${key}-collab` ? { background: "#333" } : {}),
              }}
              onMouseEnter={() => setHoveredBtn(`${key}-collab`)}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => setCollaborateModal(card)}
            >
              Collaborate
            </button>
            <button
              style={{
                ...s.btnViewProfile,
                ...(hoveredBtn === `${key}-view` ? { background: "#f0f0f0" } : {}),
              }}
              onMouseEnter={() => setHoveredBtn(`${key}-view`)}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Header */}
        <h1 style={s.heading}>Motion Designers</h1>
        <p style={s.subtitle}>Collaborate with creatives using credits</p>

        {/* Search bar */}
        <div style={s.searchWrapper}>
          <svg style={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            style={s.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search designers..."
          />
          <button style={s.searchBtn}>
            Search
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div style={s.filterRow}>
          {filters.map((f) => (
            <button key={f} style={s.filterBtn}>
              {f}
              <ChevronDown />
            </button>
          ))}
        </div>

        {/* Results header */}
        <div style={s.resultsHeader}>
          <span style={s.resultsCount}>{cards.length} creatives found</span>
          <button style={s.sortBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Recommended
          </button>
        </div>

        {/* Carousel Rows */}
        {rows.map((row) => (
          <div key={row.id} style={s.carouselSection}>
            {/* Left arrow */}
            <div
              style={{ ...s.arrowBtn, ...s.arrowLeft }}
              onClick={() => scroll(row.ref, "left")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <ChevronLeft />
            </div>

            {/* Track */}
            <div ref={row.ref} style={s.carouselTrack}>
              {row.cards.map((card) => renderCard(card, row.id))}
            </div>

            {/* Right arrow */}
            <div
              style={{ ...s.arrowBtn, ...s.arrowRight }}
              onClick={() => scroll(row.ref, "right")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <ChevronRight />
            </div>
          </div>
        ))}
      </div>

      {collaborateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", padding: "30px", borderRadius: "12px", width: "400px", maxWidth: "90%",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontFamily: s.page.fontFamily
          }}>
            <h2 style={{ marginTop: 0, fontSize: "20px" }}>Collaborate with {collaborateModal.name}</h2>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
              Décrivez vos besoins pour le projet :
            </p>
            <textarea
              value={requestDesc}
              onChange={(e) => setRequestDesc(e.target.value)}
              placeholder="Ex: J'ai besoin d'un logo..."
              style={{
                width: "100%", height: "100px", padding: "10px", borderRadius: "8px", 
                border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "20px",
                fontFamily: "inherit"
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setCollaborateModal(null)} 
                style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendRequest}
                disabled={!requestDesc}
                style={{
                  padding: "10px 16px", borderRadius: "8px", border: "none",
                  background: requestDesc ? "#000" : "#ccc", color: "#fff", cursor: requestDesc ? "pointer" : "not-allowed"
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
