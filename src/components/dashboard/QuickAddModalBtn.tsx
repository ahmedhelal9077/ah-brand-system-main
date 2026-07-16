"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import QuickAddClient from "./QuickAddClient";
import { X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickAddModalBtn({ categories }: {categories: any[];}) {
  const { t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
        style={{ padding: "0.6rem 1rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--accent)" }}>
        
        <Zap size={18} />{"إضافة سريعة (من التليفون)"}
      </button>
      
      {isOpen &&
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "var(--bg)",
        zIndex: 1000,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }}>
          <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={20} />{"إضافة سريعة"}
          </h2>
            <button
            onClick={() => setIsOpen(false)}
            className="btn btn-secondary"
            style={{ padding: "0.5rem", borderRadius: "50%" }}
            title={"إغلاق"}>
            
              <X size={20} />
            </button>
          </div>
          
          <div style={{ flex: 1, position: "relative", padding: "1rem" }}>
            <QuickAddClient
            categories={categories}
            isModal={true}
            onSuccess={() => {
              setIsOpen(false);
              setTimeout(() => {
                router.refresh();
              }, 100);
            }} />
          
          </div>
        </div>
      }
    </>);

}
