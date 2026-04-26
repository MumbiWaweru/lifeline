// AdminLogin.jsx — Updated with TOTP MFA support
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/api";

export default function AdminLogin() {
  const [password, setPassword]     = useState("");
  const [totpCode, setTotpCode]     = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await adminApi.login(password, totpCode || undefined);

      if (result.mfa_required && !totpCode) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // Store JWT token
      localStorage.setItem("lifeline_admin_token", result.access_token);
      localStorage.setItem(
        "lifeline_token_expiry",
        String(Date.now() + result.expires_in * 1000)
      );
      navigate("/admin/dashboard");
    } catch (err) {
      const msg = err.message || "Login failed";
      if (msg.includes("MFA") || msg.includes("mfa")) {
        setMfaRequired(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page, #f7f4f0)",
    }}>
      <div style={{
        background: "white",
        borderRadius: 14,
        padding: "40px 48px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
        border: "0.5px solid #E0E0E0",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            background: "#1A5C38",
            color: "white",
            borderRadius: 10,
            padding: "8px 20px",
            display: "inline-block",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.05em",
            marginBottom: 12,
          }}>
            LIFELINE
          </div>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            Admin Portal — Secure Login
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          {/* TOTP — shown when MFA is required */}
          {mfaRequired && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 6 }}>
                Authenticator Code (6 digits)
              </label>
              <div style={{
                background: "#FAEEDA",
                border: "1px solid #EF9F27",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 10,
                fontSize: 13,
                color: "#854F0B",
              }}>
                🔐 Open your authenticator app (Google Authenticator / Authy) and enter the 6-digit code.
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  letterSpacing: "0.3em",
                  fontSize: 22,
                  textAlign: "center",
                  fontWeight: 600,
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#FCEBEB",
              border: "1px solid #E24B4A",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#A32D2D",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#888" : "#1A5C38",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "13px",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying…" : mfaRequired ? "Verify & Login" : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 20 }}>
          Session expires after 60 minutes of inactivity
        </p>
      </div>
    </div>
  );
}