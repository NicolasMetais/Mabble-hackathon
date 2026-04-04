import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Login Page</h1>
      <p>Please log in to your account.</p>
      {/* Add login form here */}
      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}