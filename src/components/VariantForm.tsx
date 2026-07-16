"use client";

import { useState, useRef } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import { createVariant } from "@/app/dashboard/products/[id]/variants/actions";

export default function VariantForm({ productId }: {productId: string;}) {
  const { t } = useSettings();
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
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
          }, "image/jpeg", 0.7);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const compressedFile = await resizeImage(file);
    const formData = new FormData();
    formData.append("file", compressedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.imageUrl);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Plus size={20} className="text-primary" /> {t("color") || "Add Color Variant"}
      </h2>
      
      <form action={createVariant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="colorName">{t("color")} Name</label>
          <input className="input-field" type="text" id="colorName" name="colorName" required placeholder="e.g. Midnight Black" />
        </div>
        
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="colorHex">{t("color")} Hex</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="input-field" type="color" id="colorHex" name="colorHex" defaultValue="#000000" style={{ width: "50px", padding: "0.2rem" }} />
          </div>
        </div>
        
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="size">{"المقاس (للملابس)"}</label>
          <input className="input-field" type="text" id="size" name="size" placeholder={"مثال: XL, L, 42..."} />
        </div>
        
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="stock">{t("quantity")}</label>
          <input className="input-field" type="number" id="stock" name="stock" required defaultValue="0" min="0" />
        </div>

        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label">{t("image")}</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "var(--secondary)",
              transition: "all 0.2s ease"
            }}>
            
            {imageUrl ?
            <img src={imageUrl} alt="Uploaded" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "var(--radius-sm)" }} /> :

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--foreground)" }}>
                <ImageIcon size={40} style={{ marginBottom: "1rem", color: "var(--primary)" }} />
                <p>{uploading ? "Uploading..." : t("uploadImage")}</p>
              </div>
            }
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept="image/*" />
            
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }} disabled={uploading}>
          {t("save")}
        </button>
      </form>
    </div>);

}
