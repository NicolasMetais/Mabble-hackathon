import React from "react";

export default function FooterApplyPage() {
  return (
    <div style={styles.footerContainer}>
      {/* CTA */}
      <div style={styles.ctaBox}>
        <div>
          <h3 style={styles.ctaTitle}>Start trading your skills today</h3>
          <p style={styles.ctaText}>
            Join our community of creatives collaborating worldwide.
          </p>
        </div>
        <button style={styles.ctaButton}>Join Mabble</button>
      </div>

      {/* Main footer */}
      <div style={styles.footerContent}>
        <div style={styles.left}>
          <h2>Mabble</h2>
          <p style={styles.bold}>Skills are the new currency.</p>
          <p>A network of creatives collaborating and growing together.</p>

          <div style={styles.socials}>
            <div style={styles.icon}>f</div>
            <div style={styles.icon}>in</div>
            <div style={styles.icon}>ig</div>
          </div>
        </div>

        <div style={styles.columns}>
          <div>
            <h4>PRODUCT</h4>
            <p>How it works</p>
            <p>Explore creatives</p>
            <p>Credit system</p>
            <p>Pricing</p>
          </div>

          <div>
            <h4>COMPANY</h4>
            <p>About</p>
            <p>Careers</p>
            <p>Blog</p>
            <p>Contact</p>
          </div>

          <div>
            <h4>RESSOURCES</h4>
            <p>Help center</p>
            <p>FAQs</p>
            <p>Community guidelines</p>
            <p>Terms & Privacy</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={styles.bottom}>
        <p>© 2026 Mabble. All rights reserved.</p>
        <div style={styles.bottomLinks}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  footerContainer: {
    marginTop: "100px",
    background: "#f5f5f5",
    padding: "40px 20px",
  },
  ctaBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "50px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  },
  ctaTitle: {
    margin: 0,
  },
  ctaText: {
    margin: "5px 0 0 0",
    color: "#666",
  },
  ctaButton: {
    background: "#000",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "20px",
    cursor: "pointer",
  },
  footerContent: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: "30px",
  },
  left: {
    maxWidth: "300px",
  },
  bold: {
    fontWeight: "bold",
  },
  socials: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  icon: {
    width: "30px",
    height: "30px",
    background: "#ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "5px",
    fontSize: "12px",
  },
  columns: {
    display: "flex",
    gap: "60px",
  },
  bottom: {
    borderTop: "1px solid #ddd",
    paddingTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#666",
  },
  bottomLinks: {
    display: "flex",
    gap: "20px",
  },
};