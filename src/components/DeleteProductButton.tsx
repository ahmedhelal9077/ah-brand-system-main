"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "../app/dashboard/products/actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("تأكيد: هل أنت متأكد من مسح هذه الشنطة نهائياً من السيستم؟ (سيتم مسح الألوان الخاصة بها أيضاً)")) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteProduct(productId);
      if (result && result.error) {
        alert(result.error);
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء المسح: " + err.message);
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
      title="مسح نهائي"
    >
      <Trash2 size={14} />
    </button>
  );
}
