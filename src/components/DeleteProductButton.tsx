"use client";
import { useSettings } from "@/lib/SettingsContext";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "../app/dashboard/products/actions";

export default function DeleteProductButton({ productId }: {productId: string;}) {
  const { t } = useSettings();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t("trans_246"))) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productId);
      if (result && result.error) {
        alert(result.error);
      }
    } catch (err: any) {
      alert(t("trans_247") + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn btn-secondary"
      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--danger)", borderColor: "var(--danger)" }}
      title={t("trans_248")}>
      
      <Trash2 size={14} />
    </button>);

}
