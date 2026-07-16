"use client";
import React, { useState } from "react";
import { Plus, Briefcase, Phone } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  purchases: any[];
};

export default function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const { t } = useSettings();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "var(--foreground)" }}>
            {t("suppliers_title") || "Suppliers & Purchases"}
          </h1>
          <p style={{ color: "var(--sidebar-inactive)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
            {t("suppliers_desc") || "Manage factory accounts and purchase invoices"}
          </p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="btn"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-text)" }}
        >
          <Plus size={20} />
          {t("add_supplier") || "Add Supplier"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {suppliers.map(s => (
          <div key={s.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--background)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={20} color="var(--sidebar-inactive)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: "bold", fontSize: "1.2rem", color: "var(--foreground)" }}>{s.name}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--sidebar-inactive)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.2rem" }}>
                  <Phone size={12}/> {s.phone || "-"}
                </p>
              </div>
            </div>

            <div style={{ 
              marginTop: "auto", 
              padding: "1rem", 
              borderRadius: "var(--radius-md)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              backgroundColor: s.balance < 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
              color: s.balance < 0 ? "var(--danger)" : "var(--primary)"
            }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{t("balance") || "Balance"}:</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {Math.abs(s.balance)} <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>EGP</span>
              </span>
            </div>
            
            <p style={{ textAlign: "center", margin: 0, marginTop: "0.8rem", fontSize: "0.85rem", color: "var(--sidebar-inactive)" }}>
              {s.balance < 0 ? (t("we_owe") || "We owe them") : s.balance > 0 ? (t("they_owe") || "They owe us") : (t("settled") || "Settled")}
            </p>
          </div>
        ))}
        
        {suppliers.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--sidebar-inactive)", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
            {t("no_suppliers") || "No suppliers added yet."}
          </div>
        )}
      </div>

      {isAddOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
           <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "1.5rem", backgroundColor: "var(--background)" }}>
             <h2 style={{ margin: 0, marginBottom: "1.5rem", fontSize: "1.3rem", fontWeight: "bold" }}>{t("add_supplier") || "Add Supplier"}</h2>
             <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={(e) => { e.preventDefault(); setIsAddOpen(false); }}>
               <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>{t("supplier_name") || "Name"}</label>
                 <input type="text" required style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
               </div>
               <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>{t("supplier_phone") || "Phone"}</label>
                 <input type="text" style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
               </div>
               <div>
                 <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>{t("initial_balance") || "Initial Balance (Optional)"}</label>
                 <input type="number" placeholder="e.g. -5000 (if we owe them)" style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
               </div>
               <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                 <button type="button" onClick={() => setIsAddOpen(false)} className="btn" style={{ flex: 1, backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                   {t("cancel") || "Cancel"}
                 </button>
                 <button type="submit" className="btn" style={{ flex: 1, backgroundColor: "var(--primary)", color: "var(--primary-text)" }}>
                   {t("save") || "Save"}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
