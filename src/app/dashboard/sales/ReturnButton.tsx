"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import { processReturn } from "./actions";
import { RotateCcw } from "lucide-react";

export default function ReturnButton({ saleItemId, quantity, returnedQuantity, price }: {saleItemId: string;quantity: number;returnedQuantity: number;price: number;}) {
  const { t } = useSettings();
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [reason, setReason] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const maxReturnable = quantity - returnedQuantity;

  const handleConfirm = async () => {
    if (returnQty <= 0 || returnQty > maxReturnable) {
      alert("Invalid return quantity");
      return;
    }
    if (!reason.trim()) {
      alert(t("trans_89"));
      return;
    }

    setLoading(true);
    const result = await processReturn(saleItemId, returnQty, reason.trim());
    if (result?.error) {
      alert(t("trans_90") + result.error);
      setLoading(false);
      setShowPrompt(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <button onClick={() => setShowPrompt(true)} disabled={loading} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
        <RotateCcw size={14} /> {loading ? t("trans_91") : t("trans_37")}
      </button>

      {showPrompt && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ background: "var(--background)", padding: "2rem", width: "400px", maxWidth: "90%", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RotateCcw size={20} />{t("trans_92")}
            </h3>
            <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--sidebar-inactive)" }}>
              أقصى كمية يمكن إرجاعها: {maxReturnable}. الإجمالي المسترد: {returnQty * price} ج.م
            </p>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>الكمية المسترجعة</label>
              <input
                type="number"
                min={1}
                max={maxReturnable}
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <div className="form-group">
              <label>{t("trans_96")}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("trans_97")}
                rows={3}
                autoFocus 
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button onClick={handleConfirm} disabled={loading || !reason.trim()} className="btn btn-primary" style={{ flex: 1, background: "var(--danger)", color: "white" }}>
                {loading ? t("trans_98") : t("trans_99")}
              </button>
              <button onClick={() => setShowPrompt(false)} disabled={loading} className="btn btn-secondary" style={{ flex: 1 }}>
                {t("trans_100")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
