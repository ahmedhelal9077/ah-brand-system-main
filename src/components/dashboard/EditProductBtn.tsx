"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import { Edit2, X, Loader2 } from "lucide-react";
import { editProduct } from "@/app/dashboard/products/actions";

export default function EditProductBtn({ product, categories }: {product: any;categories: any[];}) {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await editProduct(product.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      setError(t("trans_128"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
        title="Edit Product">
        
        <Edit2 size={14} />
      </button>

      {isOpen &&
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
          <div className="glass-panel" style={{ padding: "2rem", width: "90%", maxWidth: "500px", position: "relative" }}>
            <button
            onClick={() => setIsOpen(false)}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}>
            
              <X size={24} />
            </button>
            
            <h2 style={{ marginBottom: "1.5rem" }}>{t("trans_129")}</h2>
            
            {error && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-name">{t("trans_130")}</label>
                <input className="input-field" type="text" id="edit-name" name="name" defaultValue={product.name} required />
              </div>
              
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-price">{t("trans_131")}</label>
                <input className="input-field" type="number" step="0.01" id="edit-price" name="price" defaultValue={product.price} required />
              </div>
              
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-wholesalePrice">{t("trans_77")}</label>
                <input className="input-field" type="number" step="0.01" id="edit-wholesalePrice" name="wholesalePrice" defaultValue={product.wholesalePrice ?? 0} />
              </div>
              
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-code">{t("trans_132")}</label>
                <input className="input-field" type="number" id="edit-code" name="code" defaultValue={product.code} required />
              </div>
              
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label" htmlFor="edit-categoryId">{t("trans_11")}</label>
                <select className="input-field" id="edit-categoryId" name="categoryId" defaultValue={product.categoryId || ""}>
                  <option value="">{t("trans_133")}</option>
                  {categories.map((cat) =>
                <option key={cat.id} value={cat.id}>{cat.name}</option>
                )}
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                {loading ? <><Loader2 className="animate-spin" size={18} />{t("trans_64")}</> : t("trans_127")}
              </button>
            </form>
          </div>
        </div>
      }
    </>);

}
