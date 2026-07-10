"use client";

import { useState } from "react";
import { Package, CheckCircle, Send, Printer, Loader2 } from "lucide-react";
import ReturnButton from "@/app/dashboard/sales/ReturnButton";
import SendToBostaButton from "@/components/SendToBostaButton";
import { sendBulkOrdersToBosta } from "@/lib/bostaActions";

type Sale = any; // Since the Prisma types are complex, we use any or defined simplified type.

export default function SalesListClient({ initialSales }: { initialSales: Sale[] }) {
  const [sales, setSales] = useState(initialSales);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentTab, setCurrentTab] = useState("ALL");
  const [editDepositSale, setEditDepositSale] = useState<Sale | null>(null);
  const [editDepositAmount, setEditDepositAmount] = useState<number | "">("");
  const [editDepositScreenshot, setEditDepositScreenshot] = useState<File | null>(null);
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  const isTantaOrder = (s: any) => {
    const city = s.customerCity || "";
    const address = s.customerAddress || "";
    return city === "طنطا" || city.includes("طنطا") || (city === "الغربية" && (address.includes("طنطا") || address.toLowerCase().includes("tanta")));
  };

  const filteredSales = sales.filter(s => {
    if (currentTab === "TANTA") return isTantaOrder(s);
    
    // If the user is on standard tabs, we can optionally exclude Tanta from Bosta-centric tabs like PACKED, PRINTED, etc.
    // But keeping them visible is also fine. We'll just filter them as requested.
    if (currentTab === "ALL") return true;
    if (currentTab === "ISSUES") return s.hasIssue;
    if (currentTab === "CANCELLED") return s.status === "CANCELLED";
    if (currentTab === "PRINTED") return s.status === "PRINTED";
    if (currentTab === "PACKED") return s.status === "PACKED" && !s.hasIssue;
    if (currentTab === "PENDING") return s.status === "PENDING" && !s.hasIssue;
    if (currentTab === "COMPLETED") return s.status === "COMPLETED";
    return true;
  });
  // Reset visibleCount when tab changes
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setVisibleCount(30);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSales.length && filteredSales.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sId => sId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من إرسال ${selectedIds.length} طلب إلى بوسطة؟`)) return;

    setIsSending(true);
    try {
      const res = await sendBulkOrdersToBosta(selectedIds);
      if (res.failed > 0) {
        alert(`تم إرسال ${res.successful} بنجاح، وفشل ${res.failed}.\n\nالأخطاء:\n${res.errors.join("\n")}`);
      } else {
        alert(`تم إرسال ${res.successful} طلب بنجاح!`);
      }
      // Refresh page to show tracking numbers
      window.location.reload();
    } catch (e: any) {
      alert("حدث خطأ: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkPrint = async () => {
    if (selectedIds.length === 0) return;
    // Extract tracking IDs from selected sales
    const selectedSales = sales.filter(s => selectedIds.includes(s.id));
    const trackingIds: string[] = [];
    
    for (const sale of selectedSales) {
      if (sale.bostaAwb) {
        // extract the Bosta internal ID from the AWB url
        // https://app.bosta.co/api/v0/deliveries/awb/{id}
        const parts = sale.bostaAwb.split('/');
        const bostaId = parts[parts.length - 1];
        if (bostaId) trackingIds.push(bostaId);
      }
    }

    if (trackingIds.length === 0) {
      alert("لم يتم العثور على أي بوليصة بوسطة للطلبات المحددة (تأكد من إرسالهم لبوسطة أولاً).");
      return;
    }

    // Open our internal API route that returns the bulk PDF
    const url = `/api/bosta/awb?ids=${trackingIds.join(",")}`;
    window.open(url, '_blank');

    // Mark as printed
    const { markSalesAsPrinted } = await import('@/app/dashboard/sales/actions');
    await markSalesAsPrinted(selectedSales.map(s => s.id));
    window.location.reload();
  };

  const handleUpdateDeposit = async () => {
    if (!editDepositSale || editDepositAmount === "" || editDepositAmount <= 0) return;
    if (!editDepositScreenshot) {
      alert("يجب إرفاق صورة التحويل.");
      return;
    }
    setIsUpdatingDeposit(true);
    try {
      const { updateSaleRemainingAmount } = await import('@/app/dashboard/sales/actions');
      
      const formData = new FormData();
      formData.append("saleId", editDepositSale.id);
      formData.append("additionalDeposit", String(editDepositAmount));
      formData.append("screenshot", editDepositScreenshot);

      const res = await updateSaleRemainingAmount(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("تم تحديث المتبقي بنجاح!");
        window.location.reload();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingDeposit(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {[
          { id: "ALL", label: "الكل" },
          { id: "TANTA", label: "توصيل طنطا 🏠" },
          { id: "PENDING", label: "قيد التجهيز" },
          { id: "PACKED", label: "تم التجهيز" },
          { id: "PRINTED", label: "تمت الطباعة" },
          { id: "COMPLETED", label: "مكتمل (POS)" },
          { id: "ISSUES", label: "بها مشكلة" },
          { id: "CANCELLED", label: "ملغية" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setCurrentTab(tab.id); setSelectedIds([]); setVisibleCount(30); }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              background: currentTab === tab.id ? "var(--primary)" : "rgba(255,255,255,0.05)",
              color: currentTab === tab.id ? "var(--background)" : "var(--foreground)",
              border: "none",
              cursor: "pointer",
              fontWeight: currentTab === tab.id ? "bold" : "normal",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "bold" }}>
          <input 
            type="checkbox" 
            checked={selectedIds.length > 0 && selectedIds.length === filteredSales.length} 
            onChange={toggleSelectAll} 
            style={{ width: "1.2rem", height: "1.2rem" }}
          />
          تحديد الكل ({selectedIds.length})
        </label>

        <div style={{ flexGrow: 1 }} />

        <button 
          onClick={handleBulkPrint}
          disabled={selectedIds.length === 0}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Printer size={16} /> طباعة البوليصات المحددة
        </button>

        <button 
          onClick={handleBulkSend}
          disabled={selectedIds.length === 0 || isSending}
          className="btn"
          style={{ background: "#ea580c", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isSending ? "جاري الإرسال..." : "إرسال المحددة لبوسطة (جملة)"}
        </button>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {filteredSales.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>لا توجد أوردرات في هذا التصنيف.</div>
        ) : filteredSales.slice(0, visibleCount).map((sale: any) => (
          <div key={sale.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative" }}>
            
            {/* Checkbox for selection */}
            <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(sale.id)} 
                onChange={() => toggleSelect(sale.id)}
                style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem", paddingRight: "2.5rem" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  فاتورة رقم: <span style={{ fontFamily: "monospace", color: "white", background: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}>#{sale.invoiceCode || sale.id.slice(-6).toUpperCase()}</span>
                  {sale.type === "ONLINE" && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16, 185, 129, 0.1)", color: "var(--accent)" }}>
                      أونلاين 🌐
                    </span>
                  )}
                  {sale.type === "ONLINE" && sale.status === "PENDING" && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                      قيد التجهيز ⏳
                    </span>
                  )}
                  {sale.type === "ONLINE" && sale.status === "PACKED" && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(79, 70, 229, 0.1)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      جاهز للشحن 📦 
                      {sale.packedBy && <span style={{ opacity: 0.8, fontSize: "0.7rem", borderRight: "1px solid currentColor", paddingRight: "0.3rem" }}>تجهيز: {sale.packedBy.username}</span>}
                    </span>
                  )}
                  {sale.type === "ONLINE" && sale.status === "PRINTED" && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16, 185, 129, 0.2)", color: "#059669", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: "bold" }}>
                      تم الطباعة 🖨️
                    </span>
                  )}
                  {sale.type === "ONLINE" && sale.status === "CANCELLED" && (
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: "bold" }}>
                      تم الإلغاء ❌
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.4rem" }}>
                  {new Date(sale.createdAt).toLocaleString("ar-EG")} | الموظف: {sale.user.username}
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                {sale.discountAmount > 0 && (
                  <div style={{ fontSize: "0.9rem", color: "#f87171", marginBottom: "0.2rem", fontWeight: "bold" }}>
                    الخصم: -{sale.discountAmount.toFixed(2)} ج.م
                  </div>
                )}
                <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "var(--accent)" }}>
                  {sale.totalAmount.toFixed(2)} ج.م
                </div>
                {sale.type === "ONLINE" && sale.remainingAmount !== undefined && (
                  <div style={{ fontSize: "0.95rem", color: "var(--warning)", marginTop: "0.2rem", fontWeight: "bold" }}>
                    المتبقي: {sale.remainingAmount.toFixed(2)} ج.م
                    {sale.status !== "PRINTED" && sale.status !== "CANCELLED" && (
                       <button 
                         onClick={() => { setEditDepositSale(sale); setEditDepositAmount(""); }} 
                         className="btn btn-secondary" 
                         style={{ padding: "0.1rem 0.5rem", marginLeft: "0.5rem", fontSize: "0.75rem", borderRadius: "4px" }}
                       >
                         تعديل
                       </button>
                    )}
                  </div>
                )}
                {sale.customerName && (
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.2rem" }}>العميل: {sale.customerName}</div>
                )}
                {sale.type === "ONLINE" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <SendToBostaButton 
                      saleId={sale.id} 
                      currentTracking={sale.bostaTracking} 
                      currentAwb={sale.bostaAwb} 
                      isPacked={sale.status === "PACKED"} 
                    />
                  </div>
                )}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ color: "#9ca3af", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem", textAlign: "right" }}>المنتج</th>
                  <th style={{ padding: "0.5rem", textAlign: "center" }}>الكمية</th>
                  <th style={{ padding: "0.5rem", textAlign: "center" }}>السعر</th>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", opacity: item.isReturned ? 0.6 : 1 }}>
                    <td style={{ padding: "0.8rem 0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Package size={16} color="var(--primary)" />
                        <div>
                          <strong>{item.productVariant.product.name}</strong> <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#9ca3af" }}>#{item.productVariant.product.code}</span>
                          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>اللون: {item.productVariant.colorName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "center", fontWeight: "bold" }}>x{item.quantity}</td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "center" }}>{item.priceAtSale} ج.م</td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "left" }}>
                      {item.isReturned ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                            <CheckCircle size={14} /> مرتجع
                          </span>
                          {item.returnReason && (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "200px" }}>السبب: {item.returnReason}</span>
                          )}
                        </div>
                      ) : (
                        <ReturnButton saleItemId={item.id} quantity={item.quantity} price={item.priceAtSale} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {sales.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>لا يوجد أي فواتير مسجلة حتى الآن.</div>
        )}
      </div>

      {editDepositSale && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="glass-panel animate-scale-in" style={{ width: "100%", maxWidth: "450px", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>تعديل التحصيل لفاتورة #{editDepositSale.invoiceCode || editDepositSale.id.slice(-6).toUpperCase()}</h3>
            <p style={{ color: "var(--muted)", marginBottom: "1rem", fontSize: "0.95rem" }}>
              إذا قام العميل بتحويل مبلغ إضافي، قم بإدخاله هنا ليتم خصمه من المبلغ المتبقي (التحصيل الخاص ببوسطة).
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                <span>إجمالي الفاتورة:</span>
                <strong>{editDepositSale.totalAmount.toFixed(2)} ج.م</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                <span>المتبقي تحصيله حالياً:</span>
                <strong style={{ color: "var(--warning)" }}>{editDepositSale.remainingAmount?.toFixed(2)} ج.م</strong>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>قيمة التحويل الإضافي (الرقم اللي اتبعتلك دلوقتي):</label>
              <input 
                type="number"
                className="input-field"
                placeholder="مثال: 200"
                value={editDepositAmount}
                onChange={(e) => setEditDepositAmount(e.target.value === "" ? "" : Number(e.target.value))}
                autoFocus
                style={{ marginBottom: "1rem" }}
              />
              
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>إرفاق صورة التحويل (إجباري):</label>
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setEditDepositScreenshot(e.target.files[0]);
                  }
                }}
                className="input-field"
                style={{ marginBottom: "0.5rem", padding: "0.5rem" }}
              />

              {typeof editDepositAmount === 'number' && editDepositAmount > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#10b981", fontWeight: "bold" }}>
                  المتبقي الجديد هيتعدل ويبقى: {(editDepositSale.remainingAmount - editDepositAmount).toFixed(2)} ج.م
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => { setEditDepositSale(null); setEditDepositScreenshot(null); }} disabled={isUpdatingDeposit}>إلغاء</button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateDeposit}
                disabled={isUpdatingDeposit || editDepositAmount === "" || editDepositAmount <= 0 || !editDepositScreenshot}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {isUpdatingDeposit ? <><Loader2 size={16} className="animate-spin" /> جاري التحديث...</> : "حفظ المتبقي الجديد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
