"use client";

import { useState } from "react";
import { processReturn } from "./actions";
import { RotateCcw } from "lucide-react";

export default function ReturnButton({ saleItemId, quantity, price }: { saleItemId: string, quantity: number, price: number }) {
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert("برجاء كتابة سبب الإرجاع");
      return;
    }

    setLoading(true);
    const result = await processReturn(saleItemId, reason.trim());
    if (result?.error) {
      alert("خطأ: " + result.error);
      setLoading(false);
      setShowPrompt(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <button onClick={() => setShowPrompt(true)} disabled={loading} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
        <RotateCcw size={14} /> {loading ? "جاري الإرجاع..." : "إرجاع"}
      </button>

      {showPrompt && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ background: "var(--background)", padding: "2rem", width: "400px", maxWidth: "90%", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RotateCcw size={20} /> إرجاع المنتج
            </h3>
            <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
              سيتم استرجاع {quantity} قطع للمخزن وخصم {quantity * price} ج.م من المبيعات.
            </p>
            <div className="form-group">
              <label>سبب الإرجاع (إجباري)</label>
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="اكتب سبب الإرجاع هنا..."
                rows={3}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button onClick={handleConfirm} disabled={loading || !reason.trim()} className="btn btn-primary" style={{ flex: 1, background: "var(--danger)", color: "white" }}>
                {loading ? "جاري..." : "تأكيد الإرجاع"}
              </button>
              <button onClick={() => setShowPrompt(false)} disabled={loading} className="btn btn-secondary" style={{ flex: 1 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
