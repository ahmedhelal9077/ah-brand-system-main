"use client";
import React, { useState } from "react";
import { Search, MessageCircle, Star } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

type Customer = {
  id: string;
  phone: string;
  name: string | null;
  city: string | null;
  address: string | null;
  totalOrders: number;
};

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const { t } = useSettings();
  const [search, setSearch] = useState("");

  const filtered = customers.filter(c => 
    c.phone.includes(search) || 
    (c.name && c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "var(--foreground)" }}>
          {t("crm_title") || "Customers CRM"}
        </h1>
        <p style={{ color: "var(--sidebar-inactive)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          {t("crm_desc") || "Manage loyal customers and track order history"}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", overflowX: "auto" }}>
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <Search style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--sidebar-inactive)", width: "20px", height: "20px" }} />
          <input
            type="text"
            placeholder={t("crm_search") || "Search by phone or name..."}
            style={{ 
              width: "100%", padding: "0.8rem 1rem", paddingRight: "3rem", 
              backgroundColor: "var(--background)", color: "var(--foreground)", 
              border: "1px solid var(--border)", borderRadius: "var(--radius-md)", outline: "none"
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            dir="auto"
          />
        </div>

        <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <thead style={{ backgroundColor: "var(--background)", color: "var(--sidebar-inactive)", borderBottom: "1px solid var(--border)" }}>
              <tr>
                <th style={{ padding: "1rem", fontWeight: 600 }}>{t("customer_name") || "Name"}</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>{t("customer_phone") || "Phone"}</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>{t("customer_city") || "City"}</th>
                <th style={{ padding: "1rem", fontWeight: 600 }}>{t("total_orders") || "Total Orders"}</th>
                <th style={{ padding: "1rem", fontWeight: 600, textAlign: "left" }}>{t("actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--sidebar-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "1rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {c.totalOrders > 5 && <Star size={16} fill="var(--warning)" color="var(--warning)" />}
                    {c.name || "كود الفاتورة:" /* Unknown */}
                  </td>
                  <td style={{ padding: "1rem", opacity: 0.8 }}>{c.phone}</td>
                  <td style={{ padding: "1rem", opacity: 0.8 }}>{c.city || "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>
                    <span style={{ background: "var(--background)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", border: "1px solid var(--border)" }}>
                      {c.totalOrders}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "left" }}>
                    <a
                      href={`https://wa.me/2${c.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ 
                        backgroundColor: "var(--primary)", 
                        color: "var(--primary-text)", 
                        padding: "0.5rem 1rem",
                        fontSize: "0.85rem"
                      }}
                    >
                      <MessageCircle size={16} />
                      {t("app_msg") || "WhatsApp"}
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>
                    {t("noMatchingItems") || "No matching items found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
