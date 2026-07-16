"use client";
import { useSettings } from "@/lib/SettingsContext";

import React, { useState, useTransition } from "react";
import { Package, CheckCircle, Clock, RefreshCw, AlertTriangle, X, Send, Trash2, Plus, Camera, Loader2 } from "lucide-react";
import { markOrderAsPacked, markOrderAsIssue, sendDailyFulfillmentReport, resolveOrderIssue } from "../app/fulfillment/actions";
import CameraScanner from "@/components/CameraScanner";

export default function FulfillmentClient({ initialOrders }: {initialOrders: any[];}) {
  const { t } = useSettings();
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
    return city === t("trans_175") || city.includes(t("trans_175")) || city === t("trans_176") && (address.includes(t("trans_175")) || address.toLowerCase().includes("tanta"));
  };

  const filteredOrders = orders.filter((order) => {
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
      setOrders(orders.filter((o) => o.id !== saleId));
      setSplitPromptOrderId(null);
    } catch (err: any) {
      alert(err.message || t("trans_249"));
    } finally {
      setLoading(null);
    }
  };

  const attemptPack = (order: any) => {
    // If order has packedAt, it means it was packed before and then reverted to PENDING (because of an append)
    if (order.packedAt || order.bostaAwb && order.bostaAwb.includes("/awb/")) {
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
      return alert(t("trans_250"));
    }

    setReportingIssue(true);
    try {
      await markOrderAsIssue(issueOrderId, issueReason);
      setOrders(orders.filter((o) => o.id !== issueOrderId));
      setIssueModalOpen(false);
      setIssueOrderId(null);
      setIssueReason("");
    } catch (err: any) {
      alert(err.message || t("trans_251"));
    } finally {
      setReportingIssue(false);
    }
  };

  const handleResolveEdit = async () => {
    if (!issueOrderId) return;
    if (editNewCod === "" || editNewCod < 0) return alert(t("trans_252"));
    if (!editNote.trim()) return alert(t("trans_253"));

    setReportingIssue(true);
    try {
      await resolveOrderIssue(
        issueOrderId,
        editDeletedItemIds,
        editNewBarcodes,
        Number(editNewCod),
        editNote
      );
      setOrders(orders.filter((o) => o.id !== issueOrderId));
      setIssueModalOpen(false);
      setIssueOrderId(null);
    } catch (err: any) {
      alert(err.message || t("trans_254"));
    } finally {
      setReportingIssue(false);
    }
  };



  const handleSendReport = async () => {
    if (!window.confirm(t("trans_255"))) return;
    setReportingIssue(true);
    try {
      await sendDailyFulfillmentReport();
      alert(t("trans_256"));
    } catch (err: any) {
      alert(err.message || t("trans_257"));
    } finally {
      setReportingIssue(false);
    }
  };

  return (
    <div>
      {/* Global Loading Overlay */}
      {(loading !== null || reportingIssue) &&
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 99999
      }}>
          <Loader2 size={64} className="text-primary" style={{ marginBottom: "1rem", animation: "spin 2s linear infinite" }} />
          <h2 style={{ color: "white", fontSize: "1.8rem", marginBottom: "0.5rem" }}>{t("trans_258")}</h2>
          <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>{t("trans_259")}</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={24} className="text-primary" />
            <span>{t("trans_260")}</span>
            <span style={{ background: "var(--primary)", color: "var(--background)", padding: "0.2rem 0.8rem", borderRadius: "var(--radius-full)", fontSize: "1.1rem" }}>
              {orders.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleSendReport}
              disabled={reportingIssue}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0ea5e9", color: "white" }}>
              
              <Send size={18} /> {reportingIssue ? t("trans_191") : t("trans_261")}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              
              <RefreshCw size={18} />{t("trans_138")}
            </button>
          </div>
        </div>
        
        <input
          type="text"
          placeholder={t("trans_262")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: "100%", maxWidth: "400px" }} />
        
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => startTransition(() => setActiveTab("SHIPPING"))}
            style={{ flex: 1, padding: "0.8rem", borderRadius: "var(--radius-md)", border: "none", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", background: activeTab === "SHIPPING" ? "var(--primary)" : "rgba(255,255,255,0.05)", color: activeTab === "SHIPPING" ? "var(--background)" : "var(--foreground)", opacity: isPending ? 0.7 : 1 }}>{t("trans_263")}

            {shippingCount})
          </button>
          <button
            onClick={() => startTransition(() => setActiveTab("TANTA"))}
            style={{ flex: 1, padding: "0.8rem", borderRadius: "var(--radius-md)", border: "none", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s", background: activeTab === "TANTA" ? "#10b981" : "rgba(255,255,255,0.05)", color: activeTab === "TANTA" ? "white" : "var(--foreground)", opacity: isPending ? 0.7 : 1 }}>{t("trans_264")}

            {tantaCount})
          </button>
        </div>
      </div>

      {orders.length === 0 ?
      <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <CheckCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 1rem", opacity: 0.8 }} />
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{t("trans_265")}</h2>
          <p style={{ color: "#9ca3af" }}>{t("trans_266")}</p>
        </div> :

      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
      {filteredOrders.length === 0 ?
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#9ca3af" }}>{t("trans_267")}</div> :

        filteredOrders.map((order) =>
          <div key={order.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative", borderTop: "4px solid var(--warning)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Package size={20} className="text-warning" />{t("trans_141")}{order.invoiceCode}
                  {order.isExchange &&
                  <span style={{ fontSize: "0.8rem", background: "var(--warning)", color: "black", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold" }}>{t("trans_268")}</span>
                  }
                </h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={14} /> {new Date(order.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>{t("trans_143")}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {(() => {
                const packedAtDate = order.packedAt ? new Date(order.packedAt).getTime() : null;
                const newItems = packedAtDate ? order.items.filter((item: any) => new Date(item.createdAt).getTime() > packedAtDate) : [];
                const oldItems = packedAtDate ? order.items.filter((item: any) => new Date(item.createdAt).getTime() <= packedAtDate) : order.items;

                const renderItem = (item: any, isNew: boolean) =>
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: isNew ? "rgba(245, 158, 11, 0.1)" : "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "8px", border: isNew ? "1px dashed var(--warning)" : "1px solid rgba(255,255,255,0.05)", opacity: isNew ? 1 : 0.7 }}>
                    {item.productVariant.imageUrl ?
                  <img src={item.productVariant.imageUrl} alt="Product" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} /> :

                  <div style={{ width: "100px", height: "100px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                        <Package size={32} />
                      </div>
                  }
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "bold", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {item.productVariant.product.name}
                        {isNew && <span style={{ fontSize: "0.75rem", background: "var(--warning)", color: "black", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>{t("trans_269")}</span>}
                      </p>
                      <p style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>{t("trans_144")}{item.productVariant.colorName}{t("trans_145")}{item.productVariant.product.code}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", fontWeight: "bold", fontSize: "1.3rem" }}>
                      {item.quantity}x
                    </div>
                  </div>;


                if (newItems.length > 0) {
                  return (
                    <>
                      <div style={{ marginBottom: "1rem" }}>
                        <h5 style={{ color: "var(--warning)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>{t("trans_270")}</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {newItems.map((item: any) => renderItem(item, true))}
                        </div>
                      </div>
                      <div>
                        <h5 style={{ color: "#9ca3af", marginBottom: "0.5rem", fontSize: "0.9rem" }}>{t("trans_271")}</h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {oldItems.map((item: any) => renderItem(item, false))}
                        </div>
                      </div>
                    </>);

                }

                return order.items.map((item: any) => renderItem(item, false));
              })()}
            </div>
          </div>

          <div style={{ background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.95rem", color: "#0ea5e9", marginBottom: "0.5rem", fontWeight: "bold" }}>{t("trans_272")}</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div><span style={{ color: "#9ca3af" }}>{t("trans_205")}</span> {order.customerName || t("trans_52")}</div>
              <div><span style={{ color: "#9ca3af" }}>{t("trans_273")}</span> {order.customerPhone || t("trans_52")}</div>
              <div><span style={{ color: "#9ca3af" }}>{t("trans_274")}</span> {order.customerCity || t("trans_52")}</div>
              <div><span style={{ color: "#9ca3af" }}>{t("trans_275")}</span> {order.customerAddress || t("trans_52")}</div>
            </div>
            
            {order.customerPhone &&
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <a
                href={`tel:${order.customerPhone}`}
                className="btn btn-secondary"
                style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}
                title={t("trans_276")}>{t("trans_277")}


              </a>
                <a
                href={`https://wa.me/2${order.customerPhone.startsWith('0') ? order.customerPhone : '0' + order.customerPhone}`}
                target="_blank" rel="noopener noreferrer"
                className="btn"
                style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.5rem", background: "#25D366", color: "white", textDecoration: "none", borderRadius: "var(--radius-md)", fontWeight: "bold" }}
                title={t("trans_278")}>{t("trans_279")}


              </a>
              </div>
            }
            <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px dashed rgba(14, 165, 233, 0.2)", fontSize: "1.1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{t("trans_280")}</span>
              <span style={{ color: "var(--warning)", fontSize: "1.3rem" }}>
                {order.remainingAmount !== null ? order.remainingAmount : order.totalAmount}{t("trans_4")}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: "0.8rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", opacity: loading === order.id ? 0.7 : 1 }}
              onClick={() => attemptPack(order)}
              disabled={loading === order.id || reportingIssue}>
              
              {loading === order.id ? t("trans_218") : <><CheckCircle size={20} />{t("trans_281")}</>}
            </button>

            <button
              className="btn btn-danger"
              style={{ padding: "0.8rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              onClick={() => handleOpenIssueModal(order.id)}
              disabled={loading === order.id || reportingIssue}
              title={t("trans_282")}>
              
              <AlertTriangle size={20} />{t("trans_283")}
            </button>
          </div>
        </div>
        )
        }
      </div>
      }

      {/* Modal for Issue Reporting & Editing */}
      {issueModalOpen &&
      <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
                <AlertTriangle size={24} />{t("trans_284")}
            </h2>
              <button onClick={() => setIssueModalOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button
              onClick={() => setIssueMode("REPORT")}
              className={`btn ${issueMode === "REPORT" ? "btn-danger" : "btn-secondary"}`}
              style={{ flex: 1, opacity: issueMode === "REPORT" ? 1 : 0.6 }}>{t("trans_285")}


            </button>
              <button
              onClick={() => setIssueMode("EDIT")}
              className={`btn ${issueMode === "EDIT" ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1, opacity: issueMode === "EDIT" ? 1 : 0.6 }}>{t("trans_286")}


            </button>
            </div>

            {issueMode === "REPORT" &&
          <>
                <p style={{ marginBottom: "1rem", color: "#e5e7eb" }}>{t("trans_287")}

            </p>
                <textarea
              value={issueReason}
              onChange={(e) => setIssueReason(e.target.value)}
              placeholder={t("trans_288")}
              className="input-field"
              style={{ width: "100%", height: "120px", resize: "vertical", marginBottom: "1.5rem" }} />
            
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-secondary" onClick={() => setIssueModalOpen(false)} disabled={reportingIssue}>{t("trans_100")}</button>
                  <button className="btn btn-danger" onClick={handleSubmitIssue} disabled={reportingIssue}>
                    {reportingIssue ? t("trans_191") : t("trans_289")}
                  </button>
                </div>
              </>
          }

            {issueMode === "EDIT" &&
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px" }}>
                  <h4 style={{ marginBottom: "0.5rem" }}>{t("trans_290")}</h4>
                  {orders.find((o) => o.id === issueOrderId)?.items.map((item: any) =>
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: editDeletedItemIds.includes(item.id) ? 0.3 : 1 }}>
                      <div>
                        {item.productVariant.product.name} ({item.productVariant.colorName})
                      </div>
                      <button
                  onClick={() => {
                    if (editDeletedItemIds.includes(item.id)) {
                      setEditDeletedItemIds(editDeletedItemIds.filter((id) => id !== item.id));
                    } else {
                      if (window.confirm(t("trans_291"))) {
                        setEditDeletedItemIds([...editDeletedItemIds, item.id]);
                      }
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: "bold" }}>
                  
                        {editDeletedItemIds.includes(item.id) ? t("trans_292") : <><Trash2 size={18} />{t("trans_293")}</>}
                      </button>
                    </div>
              )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                type="text"
                placeholder={t("trans_294")}
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
                style={{ flex: 1 }} />
              
                  <button
                className="btn btn-secondary"
                onClick={() => {
                  if (editBarcodeText.trim()) {
                    setEditNewBarcodes([...editNewBarcodes, editBarcodeText.trim()]);
                    setEditBarcodeText("");
                  }
                }}>
                
                    <Plus size={20} />{t("trans_295")}
              </button>
                  <button
                className="btn btn-secondary"
                onClick={() => setShowScanner(true)}
                title={t("trans_296")}>
                
                    <Camera size={20} />
                  </button>
                </div>
                {editNewBarcodes.length > 0 &&
            <div style={{ padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                    <strong>{t("trans_297")}</strong>
                    <ul style={{ paddingRight: "1.5rem" }}>
                      {editNewBarcodes.map((b, i) =>
                <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {b}
                          <button onClick={() => setEditNewBarcodes(editNewBarcodes.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}><X size={14} /></button>
                        </li>
                )}
                    </ul>
                  </div>
            }

                <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder={t("trans_298")}
              className="input-field"
              style={{ width: "100%", height: "80px", resize: "vertical" }} />
            

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", background: "rgba(245, 158, 11, 0.1)", padding: "1rem", borderRadius: "8px" }}>
                  <label style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{t("trans_299")}</label>
                  <input
                type="number"
                className="input-field"
                value={editNewCod}
                onChange={(e) => setEditNewCod(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={t("trans_300")}
                style={{ width: "180px", border: "1px solid var(--warning)" }} />
              
                  <span style={{ fontSize: "0.9rem", color: "var(--warning)" }}>{t("trans_301")}</span>
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button className="btn btn-secondary" onClick={() => setIssueModalOpen(false)} disabled={reportingIssue}>{t("trans_100")}</button>
                  <button className="btn btn-primary" onClick={handleResolveEdit} disabled={reportingIssue}>
                    {reportingIssue ? t("trans_218") : t("trans_302")}
                  </button>
                </div>
              </div>
          }
          </div>
        </div>
      }

      {showScanner &&
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "black", zIndex: 9999, display: "flex", flexDirection: "column"
      }}>
          <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", background: "#111", color: "white" }}>
            <h3>{t("trans_303")}</h3>
            <button onClick={() => setShowScanner(false)} style={{ background: "none", border: "none", color: "white" }}><X size={24} /></button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <CameraScanner
            onScan={(decodedText) => {
              setEditNewBarcodes([...editNewBarcodes, decodedText]);
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)} />
          
          </div>
        </div>
      }

      {/* Split Package Prompt Modal */}
      {splitPromptOrderId &&
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}>
          <div className="glass-panel animate-scale-in" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={24} className="text-warning" />{t("trans_304")}

            </h3>
              <button onClick={() => setSplitPromptOrderId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ marginBottom: "1.5rem", color: "var(--muted)", lineHeight: 1.6 }}>{t("trans_305")}

          </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
              onClick={() => handlePack(splitPromptOrderId, orders.find((o) => o.id === splitPromptOrderId)?.items?.length || 0, false, orders.find((o) => o.id === splitPromptOrderId)?.updatedAt)}
              disabled={loading === splitPromptOrderId}
              className="btn btn-primary"
              style={{ padding: "1rem", fontSize: "1.1rem" }}>{t("trans_306")}


            </button>
              
              <button
              onClick={() => handlePack(splitPromptOrderId, orders.find((o) => o.id === splitPromptOrderId)?.items?.length || 0, true, orders.find((o) => o.id === splitPromptOrderId)?.updatedAt)}
              disabled={loading === splitPromptOrderId}
              className="btn btn-secondary"
              style={{ padding: "1rem", fontSize: "1.1rem", borderColor: "var(--warning)", color: "var(--warning)" }}>{t("trans_307")}


            </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
