import React from "react";
import FooterApplyPage from "../FooterApplyPage.jsx";
import Header from "../Header.jsx";
import { Link } from "react-router-dom";


export default function ApplyPage() {
  return (

    <div>
      {/* Form section */}
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>START BUILDING IN SYNC</h1>

        <label style={styles.label}>• Email address</label>
        <input type="email" style={styles.input} />

        <label style={styles.label}>• Password</label>
        <input type="password" style={styles.input} />

        <p style={styles.signupText}>
          Don’t have an account?{" "}
          <Link to="/create-account" style={styles.link}>
            Sign up
          </Link>
        </p>
        

      </div>

      {/* Footer text */}
      <div style={styles.footer}>
        <h2 style={styles.footerBigText}>Welcome to Mabble</h2>
        <p style={styles.footerText}>
          A network of creatives collaborating and growing together.
          <br />
          Skills are the new currency.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "#ffffff",
    minHeight: "100vh",
    padding: "20px",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "60px",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "20px",
  },
  navLinks: {
    display: "flex",
    gap: "20px",
  },
  active: {
    borderBottom: "2px solid black",
    borderRadius: "7px",
  },
  loginBtn: {
    marginRight: "10px",
    padding: "6px 12px",
  },
  getStartedBtn: {
    padding: "6px 12px",
    background: "linear-gradient(90deg, #7b61ff, #ff0000)",
    border: "none",
    color: "white",
    borderRadius: "5px",
  },
  formWrapper: {
    paddingTop: "2rem",
    maxWidth: "35rem",
    margin: "0 auto",
    textAlign: "left",
  },
  title: {
    fontSize: "3.5rem",
    marginBottom: "30px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontSize: "1.5rem",
  },
  input: {
    width: "100%",
    height: "50px",
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "#eee",
  },
  signupText: {
    marginTop: "10px",
  },
  link: {
    color: "blue",
    textDecoration: "none",
  },
  footer: {
    marginTop: "7rem",
    textAlign: "center",
  },
  footerBigText: {
    fontSize: "3rem",
  },
  footerText: {
    fontSize: "1.3rem",
  },
};
