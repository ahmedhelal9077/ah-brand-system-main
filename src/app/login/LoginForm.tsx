"use client";


import { useState, useEffect } from "react";
import PasswordInput from "@/components/PasswordInput";
import { loginAction, restoreSessionAction } from "./actions";

export default function LoginForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkLocalSession() {
      const token = localStorage.getItem('bag_session_token');
      if (token) {
        const result = await restoreSessionAction(token);
        if (result.success && result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        } else {
          localStorage.removeItem('bag_session_token');
        }
      }
      setChecking(false);
    }
    checkLocalSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    
    if (result.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else if (result.success && result.sessionToken && result.redirectUrl) {
      localStorage.setItem('bag_session_token', result.sessionToken);
      window.location.href = result.redirectUrl;
    }
  };

  if (checking) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", width: "100%", maxWidth: "400px" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", textAlign: "center" }}>Welcome Back</h1>
      <p style={{ color: "var(--foreground)", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Login to access the Bag Inventory System
      </p>
      
      {errorMsg && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "0.8rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {errorMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="username">Username</label>
          <input className="input-field" type="text" id="username" name="username" required placeholder="Enter username" />
        </div>
        
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" required placeholder="Enter password" />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
