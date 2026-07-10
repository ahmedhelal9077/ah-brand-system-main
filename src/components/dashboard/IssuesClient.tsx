"use client";

import React, { useState } from "react";
import { Package, CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { resolveOrderIssue, cancelOrderFromIssue } from "../../app/dashboard/issues/actions";

export default function IssuesClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleResolve = async (saleId: string) => {
    setLoading(saleId);
    try {
      await resolveOrderIssue(saleId);
      setOrders(orders.filter(o => o.id !== saleId));
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async (saleId: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذا الأوردر بالكامل وإرجاع المنتجات للمخزن؟")) return;
    
    setLoading(saleId);
    try {
      await cancelOrderFromIssue(saleId);
      setOrders(orders.filter(o => o.id !== saleId));
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
            <AlertTriangle size={24} />
            <span>إجمالي مشاكل التقفيل:</span>
            <span style={{ background: "var(--danger)", color: "white", padding: "0.2rem 0.8rem", borderRadius: "var(--radius-full)", fontSize: "1.1rem" }}>
              {orders.length}
            </span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <RefreshCw size={18} /> تحديث الشاشة
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <CheckCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 1rem", opacity: 0.8 }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>لا توجد مشاكل تقفيل حالياً</h2>
          <p style={{ color: "#9ca3af" }}>كل الأوردرات ماشية تمام والمخزن مفيش فيه أي تعطيل.</p>
        </div>
      ) : (
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {orders.map(order => (
          <div key={order.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative", borderTop: "4px solid var(--danger)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={20} className="text-danger" /> فاتورة #{order.invoiceCode}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={14} /> {new Date(order.createdAt).toLocaleString("ar-EG")}
              </p>
            </div>
          </div>
          
          <div style={{ background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--danger)", marginBottom: "0.5rem", fontWeight: "bold" }}>السبب / المشكلة:</h4>
            <p style={{ fontSize: "1rem", lineHeight: 1.5 }}>{order.issueReason}</p>
          </div>

          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>المنتجات المطلوبة:</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {order.items.map((item: any) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {item.productVariant.imageUrl ? (
                    <img src={item.productVariant.imageUrl} alt="Product" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                  ) : (
                    <div style={{ width: "50px", height: "50px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                      <Package size={24} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{item.productVariant.product.name}</p>
                    <p style={{ color: "var(--primary)", fontSize: "0.85rem" }}>لون: {item.productVariant.colorName} | كود: #{item.productVariant.product.code}</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "1.1rem" }}>
                    {item.quantity}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: "0.8rem", display: "flex", justifyContent: "center", gap: "0.5rem", opacity: loading === order.id ? 0.7 : 1 }}
              onClick={() => handleResolve(order.id)}
              disabled={loading === order.id}
              title="إرجاع الأوردر للمخزن عشان يتجهز تاني"
            >
              {loading === order.id ? "..." : <><CheckCircle size={20} /> حل وإعادة للمخزن</>}
            </button>

            <button 
              className="btn btn-danger" 
              style={{ flex: 1, padding: "0.8rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", opacity: loading === order.id ? 0.7 : 1 }}
              onClick={() => handleCancel(order.id)}
              disabled={loading === order.id}
            >
              {loading === order.id ? "..." : <><XCircle size={20} /> إلغاء الأوردر</>}
            </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
