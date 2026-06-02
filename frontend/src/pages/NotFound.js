import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          color: "var(--green-dark)",
        }}
      >
        Page Not Found
      </h2>
      <p style={{ color: "var(--text-mid)", margin: "12px 0 24px" }}>
        This page doesn't exist yet.
      </p>
      <Link to="/" className="btn btn-primary">
        Go Home
      </Link>
    </div>
  );
}
