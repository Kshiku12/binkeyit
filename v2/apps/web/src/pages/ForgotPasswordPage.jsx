import { useState } from "react";
import { api } from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  const sendOtp = async () => {
    await api.post("/api/v2/auth/forgot-password", { email });
    setMsg("OTP sent to email (check SMTP config).");
  };

  const verifyOtp = async () => {
    await api.post("/api/v2/auth/verify-forgot-otp", { email, otp });
    setMsg("OTP verified.");
  };

  const reset = async () => {
    await api.post("/api/v2/auth/reset-password", { email, newPassword, confirmPassword });
    setMsg("Password reset successful.");
  };

  return (
    <div className="container" style={{ paddingTop: 24, display: "grid", gap: 10, maxWidth: 500 }}>
      <h2>Forgot Password (OTP)</h2>
      <input className="search" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn btn-primary" onClick={sendOtp}>
        Send OTP
      </button>

      <input className="search" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
      <button className="btn btn-primary" onClick={verifyOtp}>
        Verify OTP
      </button>

      <input
        className="search"
        placeholder="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        className="search"
        placeholder="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button className="btn btn-primary" onClick={reset}>
        Reset Password
      </button>
      <p className="small">{msg}</p>
    </div>
  );
}
