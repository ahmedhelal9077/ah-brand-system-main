"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { sendOrderToBosta } from "@/lib/bostaActions";

export default function SendToBostaButton({ saleId, currentTracking, currentAwb, isPacked }: { saleId: string, currentTracking: string | null, currentAwb: string | null, isPacked: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(currentTracking);
  const [awb, setAwb] = useState<string | null>(currentAwb);

  const handleSend = async () => {
    if (!confirm("هل أنت متأكد من إرسال هذا الطلب لشركة بوسطة؟")) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await sendOrderToBosta(saleId);
      if (res.error) {
        setError(res.error);
      } else {
        setTracking(res.trackingNumber || "Success");
        setAwb(res.awbUrl || null);
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!awb) return;
    const parts = awb.split('/');
    const bostaId = parts[parts.length - 1];
    if (bostaId) {
      window.open(`/api/bosta/awb?ids=${bostaId}`, '_blank');
      // Import and call action
      const { markSalesAsPrinted } = await import('@/app/dashboard/sales/actions');
      await markSalesAsPrinted([saleId]);
      // The parent component might not reflect the status change immediately without a reload
      // but the DB is updated. A reload is simple enough.
      window.location.reload();
    }
  };

  if (tracking?.startsWith("LOCAL-TANTA")) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#10b981", fontWeight: "bold" }}>
        <CheckCircle size={16} /> توصيل داخلي (طنطا) 🚚
      </div>
    );
  }

  if (tracking) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--accent)" }}>
        <CheckCircle size={16} /> تم الإرسال ({tracking})
        {awb && (
          <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <ExternalLink size={14} /> طباعة البوليصة
          </button>
        )}
      </div>
    );
  }

  if (!isPacked) {
    return <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>في انتظار التجهيز</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <button 
        onClick={handleSend}
        disabled={loading}
        className="btn"
        style={{ background: "#ea580c", color: "white", padding: "0.3rem 0.5rem", fontSize: "0.8rem", width: "fit-content" }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        إرسال لبوسطة
      </button>
      {error && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{error}</span>}
    </div>
  );
}
