import { useState } from "react";

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Mono', monospace",
    backgroundColor: "#ffffff",
    color: "#111",
  },

  // LEFT PANEL
  left: {
    flex: 1,
    padding: "60px 48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid #e5e5e5",
  },
  leftTop: {},
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#111",
    marginBottom: "24px",
  },
  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#111",
  },
  heading: {
    display: "flex",
    justifyContent: "left",
    fontSize: "42px",
    fontWeight: "400",
    lineHeight: "1.15",
    marginBottom: "20px",
    letterSpacing: "-0.5px",
  },
  description: {
    fontSize: "14px",
    color: "#555",
    lineHeight: "1.7",
    maxWidth: "320px",
    marginBottom: "40px",
    fontFamily: "'DM Mono', monospace",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "48px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  featureIcon: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    color: "#111",
  },
  featureText: {},
  featureTitle: {
    fontSize: "15px",
    fontWeight: "600",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "2px",
  },
  featureSub: {
    fontSize: "13px",
    color: "#888",
    fontFamily: "'DM Mono', monospace",
  },
  divider: {
    borderTop: "1px solid #e5e5e5",
    paddingTop: "28px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  emojiBlob: {
    fontSize: "40px",
    lineHeight: 1,
  },
  socialProof: {
    fontSize: "15px",
    fontWeight: "500",
    fontFamily: "'DM Mono', monospace",
  },

  // RIGHT PANEL
  right: {
    flex: 1,
    padding: "60px 48px",
    display: "flex",
    flexDirection: "column",
  },
  formTitle: {
    fontSize: "36px",
    fontWeight: "400",
    marginBottom: "6px",
    letterSpacing: "-0.3px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#888",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "36px",
  },
  section: {
    marginBottom: "28px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "10px",
  },
  labelDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#111",
    flexShrink: 0,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#f2f2f2",
    fontSize: "14px",
    fontFamily: "'DM Mono', monospace",
    color: "#111",
    outline: "none",
    boxSizing: "border-box",
    transition: "background 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#f2f2f2",
    fontSize: "14px",
    fontFamily: "'DM Mono', monospace",
    color: "#111",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: "140px",
    transition: "background 0.2s",
  },
  linksSubtitle: {
    fontSize: "12px",
    color: "#aaa",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "12px",
    marginTop: "-6px",
  },
  linksRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  linkGroup: {},
  linkLabel: {
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'DM Mono', monospace",
    marginBottom: "8px",
    display: "block",
  },
  submitBtn: {
    marginTop: "32px",
    width: "100%",
    padding: "16px",
    backgroundColor: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "background 0.2s, transform 0.1s",
  },
};

// SVG Icons
const IconShowcase = () => (
  <svg style={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="12" cy="16" r="2" />
    <line x1="8" y1="10" x2="12" y2="14" /><line x1="16" y1="10" x2="12" y2="14" />
  </svg>
);
const IconLearn = () => (
  <svg style={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M9 9h6M9 13h4" strokeLinecap="round" />
    <path d="M7 2v3M17 2v3" strokeLinecap="round" />
  </svg>
);
const IconConnect = () => (
  <svg style={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" />
    <line x1="7" y1="11" x2="17" y2="7" /><line x1="7" y1="13" x2="17" y2="17" />
  </svg>
);

export default function Form() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    about: "",
    portfolio: "",
    github: "",
  });
  const [hoveredBtn, setHoveredBtn] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Application submitted! 🎉");
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        `}
      </style>
      {/* LEFT */}
      <div style={styles.left}>
        <div style={styles.leftTop}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Application Form
          </div>
          <h1 style={styles.heading}>Join the Creative<br />Community</h1>
          <p style={styles.description}>
            Connect with designers, developers, and creative minds from around the world. Share your work, find inspiration, and grow together.
          </p>
          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <IconShowcase />
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Showcase Your Work</div>
                <div style={styles.featureSub}>Build a portfolio that stands out</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <IconLearn />
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Learn and Grow</div>
                <div style={styles.featureSub}>Access exclusive resources and mentorship</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <IconConnect />
              <div style={styles.featureText}>
                <div style={styles.featureTitle}>Connect with Peers</div>
                <div style={styles.featureSub}>Network with creative professionals</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.divider}>
          <div style={styles.emojiBlob}>🧩</div>
          <div style={styles.socialProof}>2,500+ creatives already joined</div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        <h2 style={styles.formTitle}>Apply to the community</h2>
        <p style={styles.formSubtitle}>Tell us a bit about yourself to get started</p>

        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelDot} /> Full name
          </label>
          <input
            style={styles.input}
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder=""
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelDot} /> Email address
          </label>
          <input
            style={styles.input}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder=""
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelDot} /> Tell us about you
          </label>
          <textarea
            style={styles.textarea}
            name="about"
            value={formData.about}
            onChange={handleChange}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            <span style={styles.labelDot} /> Your Links
          </label>
          <p style={styles.linksSubtitle}>Help others discover your work</p>
          <div style={styles.linksRow}>
            <div style={styles.linkGroup}>
              <span style={styles.linkLabel}>Portfolio</span>
              <input
                style={styles.input}
                type="text"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div style={styles.linkGroup}>
              <span style={styles.linkLabel}>GitHub</span>
              <input
                style={styles.input}
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        <button
          style={{
            ...styles.submitBtn,
            backgroundColor: hoveredBtn ? "#333" : "#111",
            transform: hoveredBtn ? "translateY(-1px)" : "none",
          }}
          onMouseEnter={() => setHoveredBtn(true)}
          onMouseLeave={() => setHoveredBtn(false)}
          onClick={handleSubmit}
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}
