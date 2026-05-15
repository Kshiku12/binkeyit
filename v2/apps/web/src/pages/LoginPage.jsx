import { useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Custom Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // useGoogleLogin gives an access_token, but our backend might expect an idToken
        // If your backend uses the standard Google strategy, we usually need the code or idToken
        // For @react-oauth/google useGoogleLogin, we get an implicit flow token
        // Let's try to pass it to the backend
        const res = await api.post("/api/v2/auth/google", { idToken: tokenResponse.access_token, isAccessToken: true });
        const token = res.data?.data?.accessToken;
        if (token) {
          localStorage.setItem("v2_access_token", token);
          window.dispatchEvent(new Event("auth_change"));
          navigate("/");
        }
      } catch (error) {
        console.error("Google SSO Backend Error:", error);
        setMsg("Google Auth failed on server. Try email login.");
      }
    },
    onError: (error) => {
      console.error("Google SSO Popup Error:", error);
      setMsg("Google Popup blocked or failed. Please check site settings.");
    }
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/v2/auth/login", { email, password });
      const token = res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem("v2_access_token", token);
        window.dispatchEvent(new Event("auth_change"));
      }
      navigate("/");
    } catch (error) {
      setMsg(error?.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/api/v2/auth/google", { idToken: credentialResponse.credential });
      const token = res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem("v2_access_token", token);
        window.dispatchEvent(new Event("auth_change"));
        navigate("/");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      const backendMessage = error?.response?.data?.message;
      const backendError = error?.response?.data?.error;
      setMsg(backendMessage || backendError || "Google Login failed");
    }
  };

  return (
    <div style={{ 
      minHeight: "calc(100vh - 80px)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "var(--bg-color)",
      padding: "20px"
    }}>
      <div style={{
        background: "var(--card-bg)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--border-color)",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "420px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Glowing Orbs */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: "var(--brand-green)", opacity: 0.1, borderRadius: "50%", filter: "blur(40px)", zIndex: 0 }}></div>
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, background: "#10b981", opacity: 0.1, borderRadius: "50%", filter: "blur(40px)", zIndex: 0 }}></div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>Welcome Back</h2>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>Sign in to continue your shopping</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "6px", paddingLeft: "4px" }}>Email Address</label>
              <input 
                className="search" 
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-color)", border: "1px solid var(--border-color)", color: "var(--text-dark)" }}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required
              />
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "6px", paddingLeft: "4px" }}>Password</label>
              <input
                className="search"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "var(--bg-color)", border: "1px solid var(--border-color)", color: "var(--text-dark)" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            <button 
              className="btn btn-primary" 
              type="submit"
              style={{ 
                width: "100%", 
                justifyContent: "center", 
                padding: "14px", 
                fontSize: "1rem", 
                marginTop: "8px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(12, 131, 31, 0.25)"
              }}
            >
              Login to Account
            </button>
          </form>
          
          <div style={{ display: "flex", alignItems: "center", margin: "24px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
            <span style={{ padding: "0 12px", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMsg("Google Login Failed")}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="340px"
              />
            </div>
          </div>

          {msg && (
            <div style={{ marginTop: "20px", padding: "12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.85rem", textAlign: "center", fontWeight: 600 }}>
              {msg}
            </div>
          )}

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div style={{ marginTop: "20px", padding: "12px", background: "#fef3c7", color: "#92400e", borderRadius: "8px", fontSize: "0.85rem", textAlign: "center", fontWeight: 600 }}>
              Warning: Google Client ID is missing. Please restart your Vite frontend server so it loads the .env file!
            </div>
          )}

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Forgot password? <Link to="/forgot-password" style={{ color: "var(--brand-green)", fontWeight: 700, textDecoration: "none" }}>Reset via OTP</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
