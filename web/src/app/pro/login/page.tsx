"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function ProLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Login failed");
      // Invalidate any in-flight pre-login refresh handlers before navigating.
      const { bumpAuthEpoch } = await import("@/lib/api-client");
      bumpAuthEpoch();
      // Redirect non-mothers to pro dashboard
      if (data.user?.role === "MOTHER") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/pro";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Background grid lines */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(88,166,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(88,166,255,0.15), rgba(88,166,255,0.05))",
              border: "1px solid rgba(88,166,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Activity size={24} style={{ color: "var(--primary)" }} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)",
              margin: "0 0 6px", letterSpacing: "-0.02em",
            }}
          >
            MomDigital Pro
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", margin: 0 }}>
            Expert Portal — Sign in to your clinical workspace
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "32px",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.3)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 20,
                fontSize: "0.82rem", color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email address
              </label>
              <input
                id="pro-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="doctor@hospital.com"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  background: "var(--input)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontSize: "0.9rem",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="pro-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 40px 10px 14px", borderRadius: 8,
                    background: "var(--input)", border: "1px solid var(--border)",
                    color: "var(--foreground)", fontSize: "0.9rem",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted-foreground)", padding: 0, display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="pro-login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px", borderRadius: 8,
                background: loading ? "rgba(88,166,255,0.5)" : "var(--primary)",
                color: "var(--primary-foreground)", border: "none",
                fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "opacity 0.15s ease",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", margin: 0 }}>
              New expert?{" "}
              <Link href="/pro/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                Apply for access
              </Link>
            </p>
          </div>
        </div>

        {/* Security note */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.6 }}>
          <Shield size={12} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--muted-foreground)" }}>
            All sessions are encrypted and audited
          </span>
        </div>
      </div>
    </div>
  );
}
