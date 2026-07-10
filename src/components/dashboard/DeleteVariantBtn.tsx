"use client";

import { deleteVariant } from "@/app/dashboard/products/[id]/variants/actions";
import { Trash2 } from "lucide-react";

export default function DeleteVariantBtn({ variantId, productId }: { variantId: string, productId: string }) {
  const handleDelete = async () => {
    if (!window.confirm("هل أنت متأكد من مسح هذا الموديل؟")) return;
    const result = await deleteVariant(variantId, productId);
    if (result?.error) {
      alert(result.error);
    }
  };

  return (
    <button type="button" onClick={handleDelete} className="btn btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
      <Trash2 size={14} />
    </button>
  );
}
