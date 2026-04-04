import React from "react";
import { NavLink, Link } from "react-router-dom";

export default function Header() {
  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.nav}>
        <div style={styles.logo}>Mabble.</div>
        <div style={styles.navLinks}>
          <NavLink to="/apply" style={({ isActive }) => isActive ? { ...styles.link, ...styles.active } : styles.link}>Browse</NavLink>
          <NavLink to="/" style={({ isActive }) => isActive ? { ...styles.link, ...styles.active } : styles.link}>How it works</NavLink>
          <NavLink to="/profil" style={({ isActive }) => isActive ? { ...styles.link, ...styles.active } : styles.link}>Home</NavLink>
          <NavLink to="/search" style={({ isActive }) => isActive ? { ...styles.link, ...styles.active } : styles.link}>Search talents</NavLink>
        </div>
        <div>
          <Link to="/apply" style={styles.loginBtn}>Login</Link>
          <Link to="/form" style={styles.getStartedBtn}>Get started</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    background: "#ffffff",
    padding: "20px",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "20px",
  },
  navLinks: {
    display: "flex",
    gap: "20px",
  },
  link: {
    textDecoration: "none",
    color: "inherit",
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
};
