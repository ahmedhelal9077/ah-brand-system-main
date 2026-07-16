"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import { updatePartnerExpenseShare } from "../expenses/actions";
import { Loader2 } from "lucide-react";

export default function ExpenseShareForm({ partner }: {partner: any;}) {
  const { t } = useSettings();
  const [loading, setLoading] = useState(false);
  const [share, setShare] = useState(partner.expenseShare || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updatePartnerExpenseShare(partner.id, share.toString());
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <label style={{ width: "120px", fontWeight: "bold" }}>{partner.name}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={share}
          onChange={(e) => setShare(Number(e.target.value))}
          className="input-field"
          style={{ width: "80px", textAlign: "center" }} />
        
        <span>%</span>
      </div>
      <button type="submit" className="btn btn-secondary" disabled={loading || share === partner.expenseShare} style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : "تحديث"}
      </button>
    </form>);

}
