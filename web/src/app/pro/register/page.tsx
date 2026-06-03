"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Upload, CheckCircle, AlertCircle } from "lucide-react";

const EXPERT_ROLES = [
  { value: "MBBS", label: "MBBS Doctor" },
  { value: "AYURVEDA", label: "Ayurveda Practitioner" },
  { value: "NUTRITIONIST", label: "Nutritionist / Dietician" },
  { value: "CHEF", label: "Chef / Culinary Expert" },
  { value: "YOGA_TRAINER", label: "Yoga / Pranayama Trainer" },
  { value: "WORKOUT_TRAINER", label: "Fitness / Workout Trainer" },
];

export default function ProRegisterPage() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "", specialization: "", externalLink: "",
  });
  const [credential, setCredential] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential) { setError("Please upload your credential document."); return; }
    setLoading(true); setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => v && body.append(k, v));
      body.append("credential", credential);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ""}/auth/register-expert`,
        { method: "POST", body, credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Registration failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "var(--input)", border: "1px solid var(--border)",
    color: "var(--foreground)", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s ease",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 600,
    color: "var(--muted-foreground)", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={28} style={{ color: "#3FB950" }} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Application Submitted!
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Your credentials are under review by our admin team. You will receive an email notification once your account is approved — usually within 24–48 hours.
          </p>
          <div style={{ background: "rgba(88,166,255,0.05)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: 8, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", margin: 0 }}>
              <strong style={{ color: "var(--foreground)" }}>What happens next?</strong><br />
              1. Admin verifies your credential document<br />
              2. Your account is approved<br />
              3. You unlock full access to the Expert Workspace
            </p>
          </div>
          <Link href="/pro/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "var(--primary)", color: "var(--primary-foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(rgba(88,166,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div style={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, rgba(88,166,255,0.15), rgba(88,166,255,0.05))", border: "1px solid rgba(88,166,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Activity size={22} style={{ color: "var(--primary)" }} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--foreground)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Apply for Expert Access
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", margin: 0 }}>
            Complete the form below. Your application will be reviewed within 24–48 hours.
          </p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 32 }}>
          {error && (
            <div style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: "0.82rem", color: "var(--destructive)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input id="reg-name" name="name" type="text" required placeholder="Dr. Priya Sharma" value={form.name} onChange={handleChange} style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label style={labelStyle}>Role / Speciality</label>
                <select id="reg-role" name="role" required value={form.role} onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                  <option value="">Select role…</option>
                  {EXPERT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Address</label>
              <input id="reg-email" name="email" type="email" required placeholder="doctor@hospital.com" value={form.email} onChange={handleChange} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input id="reg-password" name="password" type="password" required placeholder="Min 8 characters" value={form.password} onChange={handleChange} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Specialization <span style={{ opacity: 0.6, textTransform: "none" }}>(optional)</span></label>
              <input id="reg-spec" name="specialization" type="text" placeholder="e.g. Prenatal Nutrition, Pediatric MBBS" value={form.specialization} onChange={handleChange} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Booking / WhatsApp Link <span style={{ opacity: 0.6, textTransform: "none" }}>(optional)</span></label>
              <input id="reg-link" name="externalLink" type="url" placeholder="https://wa.me/91..." value={form.externalLink} onChange={handleChange} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            {/* Credential upload */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Credential Document <span style={{ color: "var(--destructive)" }}>*</span></label>
              <label
                id="reg-credential-label"
                htmlFor="reg-credential"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "20px", borderRadius: 8, cursor: "pointer",
                  border: credential ? "1px solid rgba(63,185,80,0.5)" : "1px dashed var(--border)",
                  background: credential ? "rgba(63,185,80,0.05)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Upload size={20} style={{ color: credential ? "#3FB950" : "var(--muted-foreground)" }} />
                <span style={{ fontSize: "0.8rem", color: credential ? "#3FB950" : "var(--muted-foreground)", textAlign: "center" }}>
                  {credential ? `✓ ${credential.name}` : "Upload degree, license, or certificate (PDF, JPG, PNG — max 5 MB)"}
                </span>
                <input id="reg-credential" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={(e) => setCredential(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <button
              id="reg-submit"
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: 11, borderRadius: 8,
                background: loading ? "rgba(88,166,255,0.5)" : "var(--primary)",
                color: "var(--primary-foreground)", border: "none",
                fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting Application…" : "Submit Application"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: "0.78rem", color: "var(--muted-foreground)", textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/pro/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
