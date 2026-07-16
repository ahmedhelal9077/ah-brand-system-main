"use client";

import { useState } from "react";
import { startShift } from "@/app/dashboard/shifts/actions";
import { DollarSign, Clock, LayoutDashboard, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ShiftManager({ userId, userName }: { userId: string; userName?: string }) {
  const [startingCash, setStartingCash] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartShift = async () => {
    if (startingCash === "" || startingCash < 0) {
      setError("الرجاء إدخال مبلغ صحيح للعهدة الافتتاحية.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await startShift(userId, Number(startingCash));
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div className="glass-panel animate-scale-in" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem", borderRadius: "var(--radius-lg)", textAlign: "center", background: "var(--background)" }}>
        <div style={{ 
          width: "80px", height: "80px", borderRadius: "50%", background: "rgba(22, 163, 74, 0.1)", 
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", color: "var(--success)"
        }}>
          <Clock size={40} />
        </div>
        
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--foreground)" }}>يجب فتح وردية أولاً</h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
          مرحباً {userName}، لتتمكن من تسجيل مبيعات المحل (POS)، يرجى إدخال مبلغ العهدة الافتتاحية (الفكة) الموجودة في الدرج حالياً.
        </p>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "0.8rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ textAlign: "right" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--sidebar-inactive)" }}>العهدة الافتتاحية (ج.م)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
              <DollarSign size={18} />
            </span>
            <input
              type="number"
              min="0"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value ? Number(e.target.value) : "")}
              placeholder="0.00"
              disabled={loading}
              style={{
                width: "100%", padding: "1rem", paddingLeft: "3rem", fontSize: "1.2rem", fontWeight: "bold",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--secondary)", color: "var(--foreground)"
              }}
              autoFocus
            />
          </div>
        </div>

        <button 
          onClick={handleStartShift}
          disabled={loading || startingCash === ""}
          className="btn btn-primary"
          style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", fontSize: "1.1rem", justifyContent: "center" }}
        >
          {loading ? <Loader2 className="animate-spin" /> : "بدء الوردية الآن"}
        </button>

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
          <Link href="/dashboard" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            <LayoutDashboard size={18} /> العودة للوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
