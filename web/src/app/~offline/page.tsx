"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        background: "#FFF9F5",
        textAlign: "center",
        fontFamily: "Quicksand, sans-serif",
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: "4rem" }}>💝</div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#4A4A4A",
          margin: 0,
        }}
      >
        You&apos;re offline
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "#888",
          maxWidth: "320px",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        No internet connection found. Check your connection and try again — your
        MomDigital data is safely stored and will sync when you&apos;re back
        online.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem 2rem",
          background: "#FF9F89",
          color: "white",
          border: "none",
          borderRadius: "999px",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Quicksand, sans-serif",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
