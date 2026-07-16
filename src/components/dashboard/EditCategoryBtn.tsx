"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import { Edit2, Loader2, X } from "lucide-react";
import { editCategory } from "@/app/dashboard/categories/actions";

type Partner = {id: string;name: string;};
type Category = {id: string;name: string;partnerId: string | null;};

export default function EditCategoryBtn({ category, partners }: {category: Category;partners: Partner[];}) {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.append("id", category.id);
    const res = await editCategory(formData);

    if (res && res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--primary)" }}
        title={"تعديل القسم"}>
        
        <Edit2 size={14} />
      </button>

      {isOpen &&
      <div className="modal-backdrop" onClick={(e) => {if (e.target === e.currentTarget) setIsOpen(false);}}>
          <div className="modal-content animate-scale" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--foreground)" }}>{"تعديل القسم"}</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            {error && <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="name">{"اسم القسم"}</label>
                <input className="input-field" type="text" id="name" name="name" defaultValue={category.name} required />
              </div>

              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="partnerId">{"الشريك التابع له"}</label>
                <select className="input-field" id="partnerId" name="partnerId" defaultValue={category.partnerId || ""} required>
                  <option value="">{"-- اختر الشريك --"}</option>
                  {partners.map((p) =>
                <option key={p.id} value={p.id}>{p.name}</option>
                )}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsOpen(false)}>{"إلغاء"}

              </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </>);

}
