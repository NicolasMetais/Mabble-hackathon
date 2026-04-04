import React from "react";
import Header from "../Header.jsx";
import MultiSelectButton from "./MultiSelectButton.jsx";
import EstimateCost from "./EstimateCost.jsx";

export default function MainPage() {
  return (
    <>
      <div style={styles.container}>
        {/* HERO */}
        <div style={styles.hero}>
          <h1 style={styles.bigTitle}>
            TRADE YOUR SKILLS <br /> & BUILD TOGETHER.
          </h1>

          <p style={styles.subtitle}>
            Collaborate with designers, developers, and creatives using credits.
            <br />
            Exchange skills, grow your network, and build amazing things.
          </p>
          {/* Search bar */}
          <div style={styles.searchBar}>
            <input
              type="text"
              placeholder="Search for a skill or creative..."
              style={styles.searchInput}
            />
            <button style={styles.searchBtn}>Search →</button>
          </div>

          {/* Tags */}
          <div style={styles.tags}>
            {[
              "Logo Design",
              "Web Development",
              "3D & Animation",
              "Branding",
              "Front-End",
              "UI/UX Design",
            ].map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag} →
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 2 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            SKILLS ARE THE NEW <br /> CURRENCY
          </h2>

          <p style={styles.sectionText}>
            Mabble is a members-only community of
            <br />
            creatives exchanging their skills with others
          </p>

          <div style={styles.steps}>
            <div>
              <h4 style={styles.skillTitle}>1. Apply with your portfolio</h4>
              <p style={styles.skill}>
                Submit your portfolio and past projects.
                <br />
                Your application is reviewed before joining.
              </p>
            </div>

            <div>
              <h4 style={styles.skillTitle}>2. Define your skills</h4>
              <p style={styles.skill}>
                Select your skills and areas of expertise, such
                <br />
                as design, development, motion, and more.
              </p>
            </div>

            <div>
              <h4 style={styles.skillTitle}>3. Exchange & collaborate</h4>
              <p style={styles.skill}>
                Offer your services to earn credits, or use your
                <br />
                credits to collaborate with other creatives.
              </p>
            </div>
          </div>

          <button style={styles.howBtn}>How it works?</button>
        </div>

        {/* PRICING */}
        <div style={styles.pricing}>
          <p style={styles.pricingLabel}>PRICING</p>

          <h2 style={styles.pricingTitle}>
            NO SUBSCRIPTION <br /> PAY WITH CREDITS ONLY
          </h2>

          <p style={styles.pricingText}>
            Hire the right talent for your project
            <br />
            and pay per collaboration.
          </p>
        </div>
        <div style={styles.selectNeed}>
          <div>
            <p style={styles.selectNeedText}>What do you need?</p>
            <MultiSelectButton />
          </div>
          <div>
            <p style={styles.selectNeedText}>Project scope</p>
            <MultiSelectButton />
          </div>
        </div>
        <EstimateCost />
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "#ffffff",
    padding: "40px 20px",
  },

  hero: {
    textAlign: "center",
    marginBottom: "100px",
  },

  bigTitle: {
    fontSize: "8rem",
    fontWeight: "bold",
    lineHeight: "1.1",
    margin: "2rem",
  },

  subtitle: {
    color: "#555",
    fontSize: "1.5rem",
    lineHeight: "1.6",
    margin: "4rem",
  },

  searchBar: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "3rem",
  },

  searchInput: {
    width: "50rem",
    padding: "1rem",
    borderRadius: "8px 0 0 8px",
    border: "1px solid #ccc",
    outline: "none",
  },

  searchBtn: {
    padding: "12px 20px",
    border: "1px solid #ccc",
    borderLeft: "none",
    background: "#fff",
    cursor: "pointer",
    borderRadius: "0 8px 8px 0",
  },

  tags: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  tag: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },

  section: {
    textAlign: "center",
    marginBottom: "100px",
  },

  sectionTitle: {
    fontSize: "6rem",
    fontWeight: "1",
    lineHeight: "6.5rem",
    marginBottom: "20px",
  },

  sectionText: {
    fontSize: "2.3rem",
    color: "#444",
    margin: "6rem",
  },

  steps: {
    display: "flex",
    justifyContent: "space-evenly",
    gap: "40px",
    textAlign: "left",
    marginBottom: "30px",
  },

  howBtn: {
    padding: "10px 20px",
    borderRadius: "20px",
    border: "1px solid #aaa",
    background: "transparent",
    cursor: "pointer",
  },

  pricing: {
    textAlign: "center",
  },

  pricingLabel: {
    fontSize: "1.5rem",
    color: "#000000",
    marginBottom: "10px",
  },

  pricingTitle: {
    fontSize: "7rem",
    fontWeight: "bold",
    marginBottom: "20px",
  },

  pricingText: {
    color: "#555",
    fontSize: "1.8rem",
    lineHeight: "1.8rem",
  },
  skillTitle: {
    fontSize: "2.5rem",
  },
  skill: {
    fontSize: "1.5rem",
  },
  selectNeed: {
    display: "flex",
    justifyContent: "space-evenly",
    gap: "40px",
    textAlign: "left",
    marginBottom: "30px",
    marginTop: "30px",
  },
  selectNeedText: {
    fontSize: "2rem",
    textAlign: "left",
  },
  selectNeedTextBorder: {
    display: "flex",
    justifyContent: "space-evenly",
    padding: "0.4rem",
    fontSize: "2rem",
    textAlign: "left",
    border: "2px solid black",
  },

};
