"use client";
import React, { useState } from "react";
import { Camera, CheckCircle, AlertTriangle } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import CameraScanner from "@/components/CameraScanner";

type Variant = {
  id: string;
  barcode: string;
  stock: number;
  colorName: string;
  product: { name: string; code: number };
};

export default function AuditClient({ variants, userId }: { variants: Variant[], userId: string }) {
  const { t } = useSettings();
  const [scannedItems, setScannedItems] = useState<{ [barcode: string]: number }>({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScan = (barcode: string) => {
    setScannedItems(prev => ({
      ...prev,
      [barcode]: (prev[barcode] || 0) + 1
    }));
  };

  const handleManualAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = fd.get("barcode") as string;
    if (code) {
      handleScan(code);
      e.currentTarget.reset();
    }
  };

  const clearAudit = () => {
    if(confirm(t("confirm_clear_audit") || "Are you sure you want to clear scan data?")) {
      setScannedItems({});
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "var(--foreground)" }}>
          {t("audit_title") || "Inventory Audit"}
        </h1>
        <p style={{ color: "var(--sidebar-inactive)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          {t("audit_desc") || "Scan barcodes to take physical stock"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Scanner Panel */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>{t("scanner") || "Scanner"}</h2>
          
          {isScannerOpen ? (
            <CameraScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
          ) : (
            <button
              onClick={() => setIsScannerOpen(true)}
              style={{
                width: "100%", padding: "3rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem",
                backgroundColor: "var(--background)", cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--sidebar-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--background)"}
            >
              <Camera size={48} color="var(--sidebar-inactive)" />
              <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{t("open_scanner") || "Open Camera Scanner"}</span>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
            <div style={{ height: "1px", backgroundColor: "var(--border)", flex: 1 }}></div>
            <span style={{ fontSize: "0.85rem", color: "var(--sidebar-inactive)" }}>OR</span>
            <div style={{ height: "1px", backgroundColor: "var(--border)", flex: 1 }}></div>
          </div>

          <form onSubmit={handleManualAdd} style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              name="barcode"
              type="text" 
              placeholder={t("manual_barcode") || "Enter barcode..."} 
              style={{ flex: 1, padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--background)", color: "var(--foreground)", outline: "none" }}
              autoFocus
            />
            <button type="submit" className="btn" style={{ backgroundColor: "var(--primary)", color: "var(--primary-text)" }}>
              {t("add") || "Add"}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0 }}>{t("audit_results") || "Scan Results"}</h2>
            {Object.keys(scannedItems).length > 0 && (
              <button onClick={clearAudit} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}>
                {t("clear") || "Clear"}
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "400px", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {Object.entries(scannedItems).map(([barcode, qty]) => {
              const v = variants.find(v => v.barcode === barcode);
              if (!v) return null;
              
              const diff = qty - v.stock;
              const isMatch = diff === 0;
              const isShortage = diff < 0;

              return (
                <div key={barcode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.95rem" }}>{v.product.name} ({v.colorName})</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--sidebar-inactive)", marginTop: "0.2rem" }}>{barcode}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "1.1rem" }}>{qty} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "var(--sidebar-inactive)" }}>/ {v.stock}</span></p>
                    {isMatch ? (
                      <span style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.2rem", justifyContent: "flex-end" }}><CheckCircle size={14}/> {t("match") || "Match"}</span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: isShortage ? "var(--danger)" : "var(--warning)", display: "flex", alignItems: "center", gap: "0.2rem", justifyContent: "flex-end" }}>
                        <AlertTriangle size={14}/> 
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {Object.keys(scannedItems).length === 0 && (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sidebar-inactive)", opacity: 0.7, padding: "2rem" }}>
                {t("no_scans") || "No items scanned yet."}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
