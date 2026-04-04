import React from "react";

export function TagButton({ label, onClick }) {
  return (
    <button style={styles.button} onClick={onClick}>
      {label} →
    </button>
  );
}

const styles = {
  button: {
    padding: "12px 20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    backdropFilter: "blur(8px)",
    transition: "0.2s",
  },
};

export default TagButton;
