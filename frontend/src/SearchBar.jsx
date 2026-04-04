import React from "react";

export default function SearchBar() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.searchBar}>
        <span style={styles.icon}>🔍</span>

        <input
          type="text"
          placeholder="Search for a skill or creative..."
          style={styles.input}
        />

        <button style={styles.button}>Search →</button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: "8rem",
    paddingBottom: "4rem",
    height: "0rem",
    background: "#000000", // fond sombre comme ton image
  },

  searchBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "700px",
    height: "60px",
    padding: "8px 10px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
  },

  icon: {
    fontSize: "18px",
    marginLeft: "10px",
    color: "#ccc",
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "white",
    fontSize: "16px",
    marginLeft: "10px",
  },

  button: {
    background: "white",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
