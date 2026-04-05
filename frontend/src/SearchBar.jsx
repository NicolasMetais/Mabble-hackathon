import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ onResults, onQuery, onLoading, showInlineResults = true, placeholder = "Search for a skill or creative..." }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        setError("");
        if (onResults) onResults([]);
        return;
      }
      searchServices(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchServices = async (searchTerm) => {
    setLoading(true);
    if (onLoading) onLoading(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:4000/services/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error("La recherche a échoué");
      }
      const data = await res.json();
      setResults(data);
      if (onResults) onResults(data);
    } catch (e) {
      setError(e.message);
      setResults([]);
      if (onResults) onResults([]);
    } finally {
      setLoading(false);
      if (onLoading) onLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchServices(query.trim());
    }
  };

  const showNoResults = query.trim() !== "" && !loading && !error && results.length === 0;

  const goToUserProfile = (service) => {
    if (!service?.user_id) return;
    navigate(`/profil?userId=${service.user_id}`);
  };

  const goToCollaborate = (service) => {
    if (!service?.user_id) return;
    navigate(`/profil?userId=${service.user_id}&action=collaborate`);
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.searchBar}>
        <span style={styles.icon}>🔍</span>

        <input
          type="text"
          placeholder={placeholder}
          style={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onQuery) onQuery(e.target.value);
          }}
        />

        <button style={styles.button} type="submit">
          Search →
        </button>
      </form>

      {loading && <div style={{ color: "white", marginTop: 12 }}>Recherche en cours…</div>}
      {error && <div style={{ color: "salmon", marginTop: 12 }}>Erreur : {error}</div>}
      {showNoResults && showInlineResults && <div style={{ color: "white", marginTop: 12 }}>Aucun résultat pour « {query} »</div>}

      {showInlineResults && results.length > 0 && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <span style={styles.resultsCount}>{results.length} résultat(s)</span>
          </div>
          <div style={styles.resultsTrack}>
            {results.map((service) => (
              <div key={service.id} style={{ ...styles.resultCard, cursor: "pointer" }} onClick={() => setSelectedService(service)}>
                <div style={styles.cardTop}>
                  <div style={styles.cardTitle}>Service #{service.id}</div>
                  <div style={styles.cardBadge}>Job {service.jobs_id}</div>
                </div>
                <div style={styles.cardLine}>Prestataire: {service.first_name ?? "-"} {service.last_name ?? ""}</div>
                <div style={styles.cardLine}>{service.description}</div>
                {service.skills && (
                  <div style={styles.cardSkills}>Skills: {Array.isArray(service.skills) ? service.skills.join(', ') : String(service.skills)}</div>
                )}
                <div style={styles.cardActions}>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToCollaborate(service);
                    }}
                  >
                    Collaborate
                  </button>
                  <button
                    style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToUserProfile(service);
                    }}
                  >
                    View Profile
                  </button>
                </div>
                <div style={styles.cardFooter}>
                  <span>Mabble: {service.amountmbbl ?? service.amountMBBL}</span>
                  <span>USDC: {service.amountusdc ?? service.amountUSDC}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedService && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div style={styles.detailTitle}>Détails du service</div>
            <button style={styles.detailClose} onClick={() => setSelectedService(null)}>Fermer</button>
          </div>
          <div style={styles.detailRow}><strong>ID :</strong> {selectedService.id}</div>
          <div style={styles.detailRow}><strong>Job :</strong> {selectedService.jobs_id}</div>
          <div style={styles.detailRow}><strong>Prestataire :</strong> {selectedService.first_name ?? "-"} {selectedService.last_name ?? ""}</div>
          <div style={styles.detailRow}><strong>Description :</strong> {selectedService.description}</div>
          {selectedService.skills && (
            <div style={styles.detailRow}><strong>Skills :</strong> {Array.isArray(selectedService.skills) ? selectedService.skills.join(', ') : String(selectedService.skills)}</div>
          )}
          <div style={styles.detailRow}><strong>Mabble :</strong> {selectedService.amountmbbl ?? selectedService.amountMBBL}</div>
          <div style={styles.detailRow}><strong>USDC :</strong> {selectedService.amountusdc ?? selectedService.amountUSDC}</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingTop: 0,
    paddingBottom: 0,
    height: "auto",
    background: "transparent",
  },

  searchBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "700px",
    height: "56px",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  },

  icon: {
    fontSize: "18px",
    marginLeft: "10px",
    color: "#777",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#1A1A1A",
    fontSize: "16px",
    marginLeft: "10px",
  },

  button: {
    background: "#111111",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    fontWeight: "bold",
    color: "white",
    cursor: "pointer",
  },

  resultsSection: {
    marginTop: 24,
    width: "100%",
    maxWidth: 900,
    color: "white",
  },

  resultsHeader: {
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultsCount: {
    fontSize: 14,
    fontWeight: 700,
  },

  resultsTrack: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    paddingBottom: 12,
    scrollSnapType: "x mandatory",
  },

  resultCard: {
    minWidth: 260,
    maxWidth: 260,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "18px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    scrollSnapAlign: "start",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontWeight: 700,
    fontSize: 14,
  },

  cardBadge: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
  },

  cardLine: {
    fontSize: 13,
    lineHeight: 1.4,
    color: "#f3f3f3",
  },

  cardSkills: {
    fontSize: 12,
    color: "#dcdcdc",
  },

  cardActions: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },

  actionButton: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  actionButtonPrimary: {
    background: "#ffffff",
    color: "#111111",
    borderColor: "rgba(0,0,0,0.08)",
  },

  cardFooter: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    fontWeight: 600,
    color: "#ffffff",
  },

  detailPanel: {
    marginTop: 20,
    width: "100%",
    maxWidth: "700px",
    padding: "18px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
  },

  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  detailTitle: {
    fontSize: 16,
    fontWeight: 700,
  },

  detailClose: {
    border: "none",
    background: "#ffffff",
    color: "#111",
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  detailRow: {
    marginBottom: 10,
    fontSize: 14,
    color: "#f5f5f5",
  },
};
