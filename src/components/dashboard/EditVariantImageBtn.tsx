"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateVariantImage } from "@/app/dashboard/products/[id]/variants/actions";

export default function EditVariantImageBtn({ variantId, productId, currentImageUrl }: {variantId: string;productId: string;currentImageUrl: string | null;}) {
  const { t } = useSettings();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));else
            resolve(file);
          }, "image/jpeg", 0.7);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const resizedFile = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resizedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.imageUrl) {
        await updateVariantImage(variantId, productId, data.imageUrl);
      }
    } catch (err) {
      console.error(err);
      alert(t("trans_134"));
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const resizedFile = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resizedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.imageUrl) {
        await updateVariantImage(variantId, productId, data.imageUrl);
      }
    } catch (err) {
      console.error(err);
      alert(t("trans_134"));
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      style={{ position: "relative", width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", cursor: "pointer", flexShrink: 0 }}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      title="Change Image (Click or Drop)">
      
      {currentImageUrl ?
      <img src={currentImageUrl} alt="Variant" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :

      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--foreground)", color: "var(--background)", opacity: 0.1 }}>
          <Camera size={16} />
        </div>
      }
      
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
        {loading ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }} />
      
    </div>);

}
