"use client";

import React, { useState, useTransition } from "react";
import { Package, CheckCircle, Clock, RefreshCw, AlertTriangle, X, Send, Trash2, Plus, Camera, Loader2 } from "lucide-react";
import { markOrderAsPacked, markOrderAsIssue, sendDailyFulfillmentReport, resolveOrderIssue } from "../app/fulfillment/actions";
import CameraScanner from "@/components/CameraScanner";

export default function FulfillmentClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueOrderId, setIssueOrderId] = useState<string | null>(null);
  const [issueReason, setIssueReason] = useState("");
  const [reportingIssue, setReportingIssue] = useState(false);
  const [splitPromptOrderId, setSplitPromptOrderId] = useState<string | null>(null);

  const [issueMode, setIssueMode] = useState<"REPORT" | "EDIT">("REPORT");
  const [editDeletedItemIds, setEditDeletedItemIds] = useState<string[]>([]);
  const [editNewBarcodes, setEditNewBarcodes] = useState<string[]>([]);
  const [editBarcodeText, setEditBarcodeText] = useState("");
  const [editNewCod, setEditNewCod] = useState<number | "">("");
  const [editNote, setEditNote] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"SHIPPING" | "TANTA">("SHIPPING");

  const isTantaOrder = (order: any) => {
    const city = order.customerCity || "";
    const address = order.customerAddress || "";
    return city === "طنطا" || city.includes("طنطا") || (city === "الغربية" && (address.includes("طنطا") || address.toLowerCase().includes("tanta")));
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "TANTA" && !isTantaOrder(order)) return false;
    if (activeTab === "SHIPPING" && isTantaOrder(order)) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const invoiceMatch = order.invoiceCode?.toLowerCase().includes(q);
    const nameMatch = order.customerName?.toLowerCase().includes(q);
    const phoneMatch = order.customerPhone?.toLowerCase().includes(q);
    return invoiceMatch || nameMatch || phoneMatch;
  });

  const tantaCount = orders.filter(isTantaOrder).length;
  const shippingCount = orders.length - tantaCount;

  const handlePack = async (saleId: string, expectedItemCount: number, isSplitPackage: boolean = false, expectedUpdatedAt?: string) => {
    setLoading(saleId);
    try {
      await markOrderAsPacked(saleId, isSplitPackage, expectedItemCount, expectedUpdatedAt);
      setOrders(orders.filter(o => o.id !== saleId));
      setSplitPromptOrderId(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setLoading(null);
    }
  };

  const attemptPack = (order: any) => {
    // If order has packedAt, it means it was packed before and then reverted to PENDING (because of an append)
    if (order.packedAt || (order.bostaAwb && order.bostaAwb.includes("/awb/"))) {
      setSplitPromptOrderId(order.id);
    } else {
      handlePack(order.id, order.items?.length || 0, false, order.updatedAt);
    }
  };

  const handleOpenIssueModal = (saleId: string) => {
    setIssueOrderId(saleId);
    setIssueReason("");
    setIssueMode("REPORT");
    setEditDeletedItemIds([]);
    setEditNewBarcodes([]);
    setEditBarcodeText("");
    setEditNewCod("");
    setEditNote("");
    setIssueModalOpen(true);
  };

  const handleSubmitIssue = async () => {
    if (!issueOrderId || !issueReason.trim()) {
      return alert("برجاء كتابة سبب عدم التقفيل");
    }
    
    setReportingIssue(true);
    try {
      await markOrderAsIssue(issueOrderId, issueReason);
      setOrders(orders.filter(o => o.id !== issueOrderId));
      setIssueModalOpen(false);
      setIssueOrderId(null);
      setIssueReason("");
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء الإبلاغ عن المشكلة");
    } finally {
      setReportingIssue(false);
    }
  };

  const handleResolveEdit = async () => {
    if (!issueOrderId) return;
    if (editNewCod === "" || editNewCod < 0) return alert("برجاء إدخال مبلغ التحصيل الجديد بشكل صحيح");
    if (!editNote.trim()) return alert("برجاء كتابة ملاحظة توضح سبب التعديل");
    
    setReportingIssue(true);
    try {
      await resolveOrderIssue(
        issueOrderId, 
        editDeletedItemIds, 
        editNewBarcodes, 
        Number(editNewCod), 
        editNote
      );
      setOrders(orders.filter(o => o.id !== issueOrderId));
      setIssueModalOpen(false);
      setIssueOrderId(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء التعديل");
    } finally {
      setReportingIssue(false);
    }
  };



  const handleSendReport = async () => {
    if (!window.confirm("هل أنت متأكد من إرسال تقرير تقفيل اليوم للمدير على تليجرام؟")) return;
    setReportingIssue(true);
    try {
      await sendDailyFulfillmentReport();
      alert("تم إرسال التقرير بنجاح على تليجرام!");
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إرسال التقرير. تأكد من تفعيل تليجرام في الإعدادات.");
    } finally {
      setReportingIssue(false);
    }
  };

  return (
    <div>
      {/* Global Loading Overlay */}
      {(loading !== null || reportingIssue) && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 99999
        }}>
          <Loader2 size={64} className="text-primary" style={{ marginBottom: "1rem", animation: "spin 2s linear infinite" }} />
          <h2 style={{ color: "white", fontSize: "1.8rem", marginBottom: "0.5rem" }}>جاري معالجة الطلب...</h2>
          <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>برجاء الانتظار، لا تقم بإغلاق الصفحة</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={24} className="text-primary" />
            <span>العدد المتبقي للتجهيز:</span>
            <span style={{ background: "var(--primary)", color: "var(--background)", padding: "0.2rem 0.8rem", borderRadius: "var(--radius-full)", fontSize: "1.1rem" }}>
              {orders.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              onClick={handleSendReport} 
              disabled={reportingIssue}
              className="btn btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0ea5e9", color: "white" }}
            >
              <Send size={18} /> {reportingIssue ? "جاري الإرسال..." : "إرسال تقرير اليوم"}
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-secondary" 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <RefreshCw size={18} /> تحديث الشاشة
            </button>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder="ابحث بالكود، أو الاسم، أو الملحوظات..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: "100%", maxWidth: "400px" }}
        />
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => startTransition(() => setActiveTab("SHIPPING"))}
            style={{ flex: 1, padding: "0.8rem", borderRadius: "var(--radius-md)", border: "none", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", background: activeTab === "SHIPPING" ? "var(--primary)" : "rgba(255,255,255,0.05)", color: activeTab === "SHIPPING" ? "var(--background)" : "var(--foreground)", opacity: isPending ? 0.7 : 1 }}
          >
            🚚 تجهيز شحن محافظات ({shippingCount})
          </button>
          <button
            onClick={() => startTransition(() => setActiveTab("TANTA"))}
            style={{ flex: 1, padding: "0.8rem", borderRadius: "var(--radius-md)", border: "none", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", background: activeTab === "TANTA" ? "#10b981" : "rgba(255,255,255,0.05)", color: activeTab === "TANTA" ? "white" : "var(--foreground)", opacity: isPending ? 0.7 : 1 }}
          >
            🏠 تجهيز طنطا داخلي ({tantaCount})
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <CheckCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 1rem", opacity: 0.8 }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>لا يوجد أوردرات معلقة</h2>
          <p style={{ color: "#9ca3af" }}>تم تجهيز جميع الأوردرات الأونلاين بنجاح. عاش يا بطل! 💪</p>
        </div>
      ) : (
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
      {filteredOrders.length === 0 ? (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#9ca3af" }}>لا يوجد أوردرات تطابق البحث.</div>
      ) : (
      filteredOrders.map(order => (
        <div key={order.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative", borderTop: "4px solid var(--warning)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <Package size={20} className="text-warning" /> فاتورة #{order.invoiceCode}
                {order.isExchange && (
                  <span style={{ fontSize: "0.8rem", background: "var(--warning)", color: "black", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>استبدال 🔄</span>
                )}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={14} /> {new Date(order.createdAt).toLocaleString("ar-EG")}
              </p>
            </div>
          </div>
          
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>المنتجات المطلوبة:</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {(() => {
                const packedAtDate = order.packedAt ? new Date(order.packedAt).getTime() : null;
                const newItems = packedAtDate ? order.items.filter((item: any) => new Date(item.createdAt).getTime() > packedAtDate) : [];
                const oldItems = packedAtDate ? order.items.filter((item: any) => new Date(item.createdAt).getTime() <= packedAtDate) : order.items;

                const renderItem = (item: any, isNew: boolean) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: isNew ? "rgba(245, 158, 11, 0.1)" : "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "8px", border: isNew ? "1px dashed var(--warning)" : "1px solid rgba(255,255,255,0.05)", opacity: isNew ? 1 : 0.7 }}>
                    {item.productVariant.imageUrl ? (
                      <img src={item.productVariant.imageUrl} alt="Product" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <div style={{ width: "100px", height: "100px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                        <Package size={32} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {item.productVariant.product.name}
                        {isNew && <span style={{ fontSize: "0.75rem", background: "var(--warning)", color: "black", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>إضافة جديدة للتجهيز 🚨</span>}
                      </p>
                      <p style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>لون: {item.productVariant.colorName} | كود: #{item.productVariant.product.code}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "1.3rem" }}>
                      {item.quantity}x
                    </div>
                  </div>
                );

                if (newItems.length > 0) {
                  return (
                    <>
                      <div style={{ marginBottom: "1rem" }}>
                        <h5 style={{ color: "var(--warning)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>⚠️ منتجات مضافة حديثاً (يجب إضافتها للكرتونة):</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {newItems.map((item: any) => renderItem(item, true))}
                        </div>
                      </div>
                      <div>
                        <h5 style={{ color: "#9ca3af", marginBottom: "0.5rem", fontSize: "0.9rem" }}>📦 منتجات الفاتورة الأصلية (موجودة بالفعل):</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {oldItems.map((item: any) => renderItem(item, false))}
                        </div>
                      </div>
                    </>
                  );
                }

                return order.items.map((item: any) => renderItem(item, false));
              })()}
            </div>
          </div>

          <div style={{ background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.95rem", color: "#0ea5e9", marginBottom: "0.5rem", fontWeight: "bold" }}>بيانات التوصيل (COD):</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div><span style={{ color: "#9ca3af" }}>العميل:</span> {order.customerName || "غير محدد"}</div>
              <div><span style={{ color: "#9ca3af" }}>التليفون:</span> {order.customerPhone || "غير محدد"}</div>
              <div><span style={{ color: "#9ca3af" }}>المحافظة:</span> {order.customerCity || "غير محدد"}</div>
              <div><span style={{ color: "#9ca3af" }}>العنوان:</span> {order.customerAddress || "غير محدد"}</div>
            </div>
            
            {order.customerPhone && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <a 
                  href={`tel:${order.customerPhone}`} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}
                  title="اتصال هاتفي"
                >
                  📞 اتصال
                </a>
                <a 
                  href={`https://wa.me/2${order.customerPhone.startsWith('0') ? order.customerPhone : '0' + order.customerPhone}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="btn" 
                  style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.5rem", background: "#25D366", color: "white", textDecoration: "none", borderRadius: "var(--radius-md)", fontWeight: "bold" }}
                  title="مراسلة واتساب"
                >
                  💬 واتساب
                </a>
              </div>
            )}
            <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px dashed rgba(14, 165, 233, 0.2)", fontSize: "1.1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>المبلغ المطلوب تحصيله (COD):</span>
              <span style={{ color: "var(--warning)", fontSize: "1.3rem" }}>
                {order.remainingAmount !== null ? order.remainingAmount : order.totalAmount} ج.م
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: "0.8rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", opacity: loading === order.id ? 0.7 : 1 }}
              onClick={() => attemptPack(order)}
              disabled={loading === order.id || reportingIssue}
            >
              {loading === order.id ? "جاري التحديث..." : <><CheckCircle size={20} /> الأوردر جاهز للشحن</>}
            </button>

            <button 
              className="btn btn-danger" 
              style={{ padding: "0.8rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              onClick={() => handleOpenIssueModal(order.id)}
              disabled={loading === order.id || reportingIssue}
              title="يوجد مشكلة / لم يتم التقفيل"
            >
              <AlertTriangle size={20} /> متقفلش!
            </button>
          </div>
        </div>
      ))
      )}
      </div>
      )}

      {/* Modal for Issue Reporting & Editing */}
      {issueModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
                <AlertTriangle size={24} /> متقفلش / يوجد مشكلة
              </h2>
              <button onClick={() => setIssueModalOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button 
                onClick={() => setIssueMode("REPORT")}
                className={`btn ${issueMode === "REPORT" ? "btn-danger" : "btn-secondary"}`}
                style={{ flex: 1, opacity: issueMode === "REPORT" ? 1 : 0.6 }}
              >
                ارسال للمدير لحل المشكلة
              </button>
              <button 
                onClick={() => setIssueMode("EDIT")}
                className={`btn ${issueMode === "EDIT" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1, opacity: issueMode === "EDIT" ? 1 : 0.6 }}
              >
                تعديل الأوردر (تم الحل مع العميل)
              </button>
            </div>

            {issueMode === "REPORT" && (
              <>
                <p style={{ marginBottom: "1rem", color: "#e5e7eb" }}>
                  لماذا لم يتم تقفيل هذا الأوردر؟ (سيتم إرسال هذا السبب للمدير للتعامل مع الأوردر)
                </p>
                <textarea
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="مثال: الشنطة الكروس السوداء فيها ديفوه وخلصت من المخزن..."
                  className="input-field"
                  style={{ width: "100%", height: "120px", resize: "vertical", marginBottom: "1.5rem" }}
                />
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary" onClick={() => setIssueModalOpen(false)} disabled={reportingIssue}>إلغاء</button>
                  <button className="btn btn-danger" onClick={handleSubmitIssue} disabled={reportingIssue}>
                    {reportingIssue ? "جاري الإرسال..." : "إرسال المشكلة للمدير"}
                  </button>
                </div>
              </>
            )}

            {issueMode === "EDIT" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>المنتجات الحالية:</h4>
                  {orders.find(o => o.id === issueOrderId)?.items.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: editDeletedItemIds.includes(item.id) ? 0.3 : 1 }}>
                      <div>
                        {item.productVariant.product.name} ({item.productVariant.colorName})
                      </div>
                      <button 
                        onClick={() => {
                          if (editDeletedItemIds.includes(item.id)) {
                            setEditDeletedItemIds(editDeletedItemIds.filter(id => id !== item.id));
                          } else {
                            if (window.confirm("تأكيد: هل تريد مسح هذا المنتج ورده للمخزن؟")) {
                              setEditDeletedItemIds([...editDeletedItemIds, item.id]);
                            }
                          }
                        }}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: "bold" }}
                      >
                        {editDeletedItemIds.includes(item.id) ? "تراجع عن الحذف" : <><Trash2 size={18} /> مسح من الأوردر</>}
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    placeholder="باركود المنتج الجديد (إسكان هنا)" 
                    className="input-field"
                    value={editBarcodeText}
                    onChange={(e) => setEditBarcodeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (editBarcodeText.trim()) {
                          setEditNewBarcodes([...editNewBarcodes, editBarcodeText.trim()]);
                          setEditBarcodeText("");
                        }
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      if (editBarcodeText.trim()) {
                        setEditNewBarcodes([...editNewBarcodes, editBarcodeText.trim()]);
                        setEditBarcodeText("");
                      }
                    }}
                  >
                    <Plus size={20} /> إضافة للأوردر
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowScanner(true)}
                    title="استخدام كاميرا الهاتف كإسكانر"
                  >
                    <Camera size={20} />
                  </button>
                </div>
                {editNewBarcodes.length > 0 && (
                  <div style={{ padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                    <strong>باركودات تمت إضافتها:</strong>
                    <ul style={{ paddingRight: "1.5rem" }}>
                      {editNewBarcodes.map((b, i) => (
                        <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {b}
                          <button onClick={() => setEditNewBarcodes(editNewBarcodes.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}><X size={14}/></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="ملاحظة التعديل (ضروري جداً - مثال: العميل وافق على استبدال الموديل...)"
                  className="input-field"
                  style={{ width: "100%", height: "80px", resize: "vertical" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", background: "rgba(245, 158, 11, 0.1)", padding: "1rem", borderRadius: "8px" }}>
                  <label style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>الرقم اللي الموظف هيكتبه هنا هيتزود عليه مصاريف الشحن أوتوماتيك:</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={editNewCod}
                    onChange={(e) => setEditNewCod(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="التحصيل قبل الشحن"
                    style={{ width: "180px", border: "1px solid var(--warning)" }}
                  />
                  <span style={{ fontSize: "0.9rem", color: "var(--warning)" }}>(سيتم إضافة 110 أو 130 ج.م على الرقم ده)</span>
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button className="btn btn-secondary" onClick={() => setIssueModalOpen(false)} disabled={reportingIssue}>إلغاء</button>
                  <button className="btn btn-primary" onClick={handleResolveEdit} disabled={reportingIssue}>
                    {reportingIssue ? "جاري التحديث..." : "تأكيد وتحديث الأوردر"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showScanner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "black", zIndex: 9999, display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", background: "#111", color: "white" }}>
            <h3>مسح الباركود بالكاميرا</h3>
            <button onClick={() => setShowScanner(false)} style={{ background: "none", border: "none", color: "white" }}><X size={24} /></button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <CameraScanner 
              onScan={(decodedText) => {
                setEditNewBarcodes([...editNewBarcodes, decodedText]);
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {/* Split Package Prompt Modal */}
      {splitPromptOrderId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="glass-panel animate-scale-in" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={24} className="text-warning" />
                كيف قمت بتغليف هذه الزيادة؟
              </h3>
              <button onClick={() => setSplitPromptOrderId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ marginBottom: "1.5rem", color: "var(--muted)", lineHeight: 1.6 }}>
              هذا الأوردر تم إضافة منتجات عليه بعد تجهيزه مسبقاً، هل قمت بفتح الكيس القديم وجمعهم معاً؟ أم قمت بوضع الزيادة في كيس جديد منفصل؟
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button 
                onClick={() => handlePack(splitPromptOrderId, orders.find(o => o.id === splitPromptOrderId)?.items?.length || 0, false, orders.find(o => o.id === splitPromptOrderId)?.updatedAt)}
                disabled={loading === splitPromptOrderId}
                className="btn btn-primary"
                style={{ padding: "1rem", fontSize: "1.1rem" }}
              >
                📦 جمعت القديم والجديد في كيس واحد
              </button>
              
              <button 
                onClick={() => handlePack(splitPromptOrderId, orders.find(o => o.id === splitPromptOrderId)?.items?.length || 0, true, orders.find(o => o.id === splitPromptOrderId)?.updatedAt)}
                disabled={loading === splitPromptOrderId}
                className="btn btn-secondary"
                style={{ padding: "1rem", fontSize: "1.1rem", borderColor: "var(--warning)", color: "var(--warning)" }}
              >
                🛍️ التغليف منفصل (كل أوردر في كيس لوحده)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
