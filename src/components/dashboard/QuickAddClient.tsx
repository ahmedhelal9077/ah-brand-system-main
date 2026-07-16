"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState, useRef } from "react";
import { Plus, Trash2, Camera, Save, Loader2, ArrowRight } from "lucide-react";
import { createProductWithVariants } from "@/app/dashboard/products/quick-add/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuickAddClient({ categories, isModal, onSuccess }: {categories: any[];isModal?: boolean;onSuccess?: () => void;}) {
  const router = useRouter();

  // Product State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Variants State
  const [variants, setVariants] = useState([
  { id: Date.now(), colorName: "", colorHex: "#000000", barcode: "", stock: "", imageUrl: null as string | null }]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isSavingRef = useRef(false);

  const addRow = () => {
    setVariants((prev) => [...prev, { id: Date.now(), colorName: "", colorHex: "#000000", barcode: "", stock: "", imageUrl: null }]);
  };

  const removeRow = (id: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = (id: number, field: string, value: any) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let { width, height } = img;
          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          }, "image/jpeg", 0.5);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageUpload = async (id: number, file: File) => {
    if (!file) return;

    // Resize image before uploading
    const compressedFile = await resizeImage(file);
    const formData = new FormData();
    formData.append("file", compressedFile);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      updateVariant(id, "imageUrl", data.imageUrl);
    } catch (err) {
      alert(t("trans_134"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If it's the last field (stock), add a new row
      if (field === "stock") {
        if (index === variants.length - 1) {
          addRow();
        }
        // Focus the first input of the new row after a short delay to let it render
        setTimeout(() => {
          const nextInput = document.getElementById(`colorName-${index + 1}`);
          if (nextInput) nextInput.focus();
        }, 50);
      }
    }
  };

  const handleSaveAll = async () => {
    if (isSavingRef.current) return;
    if (!name || !price) {
      setError(t("trans_153"));
      return;
    }

    const validVariants = variants.filter((v) => v.colorName.trim() !== "");
    if (validVariants.length === 0) {
      setError(t("trans_154"));
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setError("");

    const parsedVariants = validVariants.map((v) => ({
      colorName: v.colorName,
      colorHex: v.colorHex,
      barcode: v.barcode,
      stock: parseInt(v.stock) || 0,
      imageUrl: v.imageUrl
    }));

    try {
      const result = await createProductWithVariants(
        { name, price: parseFloat(price), categoryId },
        parsedVariants
      );

      if ("error" in result && result.error) {
        setError(result.error);
        setIsSaving(false);
        isSavingRef.current = false;
      } else {
        // Success!
        alert(`تم إضافة الشنطة بنجاح (كود: ${(result as any).code})`);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/products");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(t("trans_155"));
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {isSaving &&
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 9999,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        color: "white"
      }}>
          <Loader2 className="animate-spin" size={48} style={{ marginBottom: "1rem", color: "var(--accent)" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{t("trans_156")}</h2>
          <p>{t("trans_157")}</p>
        </div>
      }

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        {!isModal &&
        <Link href="/dashboard/products" className="btn btn-secondary" style={{ padding: "0.5rem" }}>
            <ArrowRight size={20} />
          </Link>
        }
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>{t("trans_158")}</h1>
      </div>

      {/* Product Details Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--primary)" }}>{t("trans_159")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t("trans_160")}</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("trans_161")}
              autoFocus />
            
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t("trans_162")}</label>
            <input
              type="number"
              className="input-field"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00" />
            
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t("trans_11")}</label>
            <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t("trans_133")}</option>
              {categories.map((cat) =>
              <option key={cat.id} value={cat.id}>{cat.name}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div className="glass-panel" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--primary)" }}>{t("trans_163")}</h2>
          <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{t("trans_164")}</span>
        </div>

        {/* Mobile-optimized cards for rows instead of a strict table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {variants.map((v, index) =>
          <div key={v.id} style={{
            display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center",
            background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)"
          }}>
              
              {/* Image Upload Button */}
              <label style={{
              width: "50px", height: "50px", borderRadius: "8px",
              background: v.imageUrl ? `url(${v.imageUrl}) center/cover` : "rgba(255,255,255,0.05)",
              border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", flexShrink: 0
            }}>
                {!v.imageUrl && <Camera size={20} color="#9ca3af" />}
                <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(v.id, e.target.files[0]);
                  }
                }} />
              
              </label>

              <div style={{ flex: "1 1 150px", display: "flex", gap: "0.3rem" }}>
                <input
                type="color"
                value={v.colorHex || "#000000"}
                onChange={(e) => updateVariant(v.id, "colorHex", e.target.value)}
                style={{ width: "40px", height: "100%", padding: "0", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer", flexShrink: 0 }}
                title={t("trans_165")} />
              
                <input
                id={`colorName-${index}`}
                type="text"
                className="input-field"
                placeholder={t("trans_166")}
                value={v.colorName}
                onChange={(e) => updateVariant(v.id, "colorName", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index, "colorName")}
                style={{ padding: "0.6rem", flex: 1 }} />
              
              </div>

              <div style={{ flex: "0 1 80px" }}>
                <input
                type="number"
                className="input-field"
                placeholder={t("trans_167")}
                value={v.stock}
                onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index, "stock")}
                style={{ padding: "0.6rem", textAlign: "center" }} />
              
              </div>

              <button
              onClick={() => removeRow(v.id)}
              className="btn btn-danger"
              style={{ padding: "0.6rem", flexShrink: 0 }}
              title={t("trans_168")}>
              
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={addRow}
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: "1rem", padding: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem", borderStyle: "dashed" }}>
          
          <Plus size={18} />{t("trans_169")}
        </button>
      </div>

      {/* Sticky Save Button for Mobile */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "1rem", background: "var(--bg)", borderTop: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", zIndex: 10
      }}>
        {error &&
        <div style={{ width: "100%", maxWidth: "600px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "0.8rem", borderRadius: "8px", border: "1px solid var(--danger)", fontSize: "0.9rem", textAlign: "center" }}>
            {error}
          </div>
        }
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="btn btn-primary"
          style={{ width: "100%", maxWidth: "600px", padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isSaving ? t("trans_170") : t("trans_171")}
        </button>
      </div>

    </div>);

}
