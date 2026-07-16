"use client";


import { deleteUser } from "./actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button 
      onClick={async () => {
        if (window.confirm("Are you sure you want to delete this user? Their sales history will be preserved.")) {
          setLoading(true);
          await deleteUser(userId);
          setLoading(false);
        }
      }}
      disabled={loading}
      className="btn btn-secondary" 
      title="Delete User" 
      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
    >
      <Trash2 size={14} /> {loading ? "..." : "Delete"}
    </button>
  );
}
