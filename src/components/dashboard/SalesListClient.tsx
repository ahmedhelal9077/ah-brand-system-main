"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useState } from "react";
import { Package, CheckCircle, Send, Printer, Loader2 } from "lucide-react";
import ReturnButton from "@/app/dashboard/sales/ReturnButton";
import SendToBostaButton from "@/components/SendToBostaButton";
import { sendBulkOrdersToBosta } from "@/lib/bostaActions";

type Sale = any; // Since the Prisma types are complex, we use any or defined simplified type.

export default function SalesListClient({ initialSales }: {initialSales: Sale[];}) {
  const { t } = useSettings();
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
    return city === t("trans_175") || city.includes(t("trans_175")) || city === t("trans_176") && (address.includes(t("trans_175")) || address.toLowerCase().includes("tanta"));
  };

  const filteredSales = sales.filter((s) => {
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
      setSelectedIds(filteredSales.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sId) => sId !== id));
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
      alert(t("trans_177") + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkPrint = async () => {
    if (selectedIds.length === 0) return;
    // Extract tracking IDs from selected sales
    const selectedSales = sales.filter((s) => selectedIds.includes(s.id));
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
      alert(t("trans_178"));
      return;
    }

    // Open our internal API route that returns the bulk PDF
    const url = `/api/bosta/awb?ids=${trackingIds.join(",")}`;
    window.open(url, '_blank');

    // Mark as printed
    const { markSalesAsPrinted } = await import('@/app/dashboard/sales/actions');
    await markSalesAsPrinted(selectedSales.map((s) => s.id));
    window.location.reload();
  };

  const handleUpdateDeposit = async () => {
    if (!editDepositSale || editDepositAmount === "" || editDepositAmount <= 0) return;
    if (!editDepositScreenshot) {
      alert(t("trans_179"));
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
        alert(t("trans_180"));
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
        { id: "ALL", label: t("trans_181") },
        { id: "TANTA", label: t("trans_182") },
        { id: "PENDING", label: t("trans_183") },
        { id: "PACKED", label: t("trans_184") },
        { id: "PRINTED", label: t("trans_185") },
        { id: "COMPLETED", label: t("trans_186") },
        { id: "ISSUES", label: t("trans_187") },
        { id: "CANCELLED", label: t("trans_188") }].
        map((tab) =>
        <button
          key={tab.id}
          onClick={() => {setCurrentTab(tab.id);setSelectedIds([]);setVisibleCount(30);}}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-full)",
            background: currentTab === tab.id ? "var(--primary)" : "rgba(255,255,255,0.05)",
            color: currentTab === tab.id ? "var(--background)" : "var(--foreground)",
            border: "none",
            cursor: "pointer",
            fontWeight: currentTab === tab.id ? "bold" : "normal",
            whiteSpace: "nowrap"
          }}>
          
            {tab.label}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "bold" }}>
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === filteredSales.length}
            onChange={toggleSelectAll}
            style={{ width: "1.2rem", height: "1.2rem" }} />{t("trans_189")} ({selectedIds.length})
        </label>

        <div style={{ flexGrow: 1 }} />

        <button
          onClick={handleBulkPrint}
          disabled={selectedIds.length === 0}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          
          <Printer size={16} />{t("trans_190")}
        </button>

        <a
          href="/api/export?type=sales"
          target="_blank"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Send size={16} /> Excel
        </a>

        <button
          onClick={handleBulkSend}
          disabled={selectedIds.length === 0 || isSending}
          className="btn"
          style={{ background: "#ea580c", color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isSending ? t("trans_191") : t("trans_192")}
        </button>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {filteredSales.length === 0 ?
        <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>{t("trans_193")}</div> :
        filteredSales.slice(0, visibleCount).map((sale: any) =>
        <div key={sale.id} className="glass-panel" style={{ padding: "1.5rem", position: "relative" }}>
            
            {/* Checkbox for selection */}
            <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>
              <input
              type="checkbox"
              checked={selectedIds.includes(sale.id)}
              onChange={() => toggleSelect(sale.id)}
              style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }} />
            
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem", paddingRight: "2.5rem" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>{t("trans_194")}
                <span style={{ fontFamily: "monospace", color: "white", background: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}>#{sale.invoiceCode || sale.id.slice(-6).toUpperCase()}</span>
                  {sale.type === "ONLINE" &&
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16, 185, 129, 0.1)", color: "var(--accent)" }}>{t("trans_195")}

                </span>
                }
                  {sale.type === "ONLINE" && sale.status === "PENDING" &&
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>{t("trans_196")}

                </span>
                }
                  {sale.type === "ONLINE" && sale.status === "PACKED" &&
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(79, 70, 229, 0.1)", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>{t("trans_197")}

                  {sale.packedBy && <span style={{ opacity: 0.8, fontSize: "0.7rem", borderRight: "1px solid currentColor", paddingRight: "0.3rem" }}>{t("trans_198")}{sale.packedBy.username}</span>}
                    </span>
                }
                  {sale.type === "ONLINE" && sale.status === "PRINTED" &&
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16, 185, 129, 0.2)", color: "#059669", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: "bold" }}>{t("trans_199")}

                </span>
                }
                  {sale.type === "ONLINE" && sale.status === "CANCELLED" &&
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontWeight: "bold" }}>{t("trans_200")}

                </span>
                }
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.4rem" }}>
                  {new Date(sale.createdAt).toLocaleString("en-GB")}{t("trans_201")}{sale.user.username}
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                {sale.discountAmount > 0 &&
              <div style={{ fontSize: "0.9rem", color: "#f87171", marginBottom: "0.2rem", fontWeight: "bold" }}>{t("trans_202")}
                {sale.discountAmount.toFixed(2)}{t("trans_4")}
              </div>
              }
                <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "var(--accent)" }}>
                  {sale.totalAmount.toFixed(2)}{t("trans_4")}
              </div>
                {sale.type === "ONLINE" && sale.remainingAmount !== undefined &&
              <div style={{ fontSize: "0.95rem", color: "var(--warning)", marginTop: "0.2rem", fontWeight: "bold" }}>{t("trans_203")}
                {sale.remainingAmount.toFixed(2)}{t("trans_4")}
                {sale.status !== "PRINTED" && sale.status !== "CANCELLED" &&
                <button
                  onClick={() => {setEditDepositSale(sale);setEditDepositAmount("");}}
                  className="btn btn-secondary"
                  style={{ padding: "0.1rem 0.5rem", marginLeft: "0.5rem", fontSize: "0.75rem", borderRadius: "4px" }}>{t("trans_204")}


                </button>
                }
                  </div>
              }
                {sale.customerName &&
              <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.2rem" }}>{t("trans_205")}{sale.customerName}</div>
              }
                {sale.type === "ONLINE" &&
              <div style={{ marginTop: "0.5rem" }}>
                    <SendToBostaButton
                  saleId={sale.id}
                  currentTracking={sale.bostaTracking}
                  currentAwb={sale.bostaAwb}
                  isPacked={sale.status === "PACKED"} />
                
                
                  </div>
              }
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ color: "#9ca3af", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem", textAlign: "right" }}>{t("trans_206")}</th>
                  <th style={{ padding: "0.5rem", textAlign: "center" }}>{t("trans_167")}</th>
                  <th style={{ padding: "0.5rem", textAlign: "center" }}>{t("trans_207")}</th>
                  <th style={{ padding: "0.5rem", textAlign: "left" }}>{t("trans_46")}</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item: any) =>
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", opacity: item.isReturned ? 0.6 : 1 }}>
                    <td style={{ padding: "0.8rem 0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Package size={16} color="var(--primary)" />
                        <div>
                          <strong>{item.productVariant.product.name}</strong> <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#9ca3af" }}>#{item.productVariant.product.code}</span>
                          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{t("trans_31")}{item.productVariant.colorName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "center", fontWeight: "bold" }}>x{item.quantity}</td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "center" }}>{item.priceAtSale}{t("trans_4")}</td>
                    <td style={{ padding: "0.8rem 0.5rem", textAlign: "left" }}>
                      {item.isReturned ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                            <CheckCircle size={14} />{t("trans_208")} {item.returnedQuantity > 0 && `(${item.returnedQuantity})`}
                          </span>
                          {item.returnReason &&
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "200px" }}>{t("trans_24")}{item.returnReason}</span>
                          }
                        </div>
                      ) : (
                        <ReturnButton saleItemId={item.id} quantity={item.quantity} returnedQuantity={item.returnedQuantity} price={item.priceAtSale} />
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {sales.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>{t("trans_209")}</div>
        )}
      </div>

      {editDepositSale &&
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}>
          <div className="glass-panel animate-scale-in" style={{ width: "100%", maxWidth: "450px", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{t("trans_210")}{editDepositSale.invoiceCode || editDepositSale.id.slice(-6).toUpperCase()}</h3>
            <p style={{ color: "var(--muted)", marginBottom: "1rem", fontSize: "0.95rem" }}>{t("trans_211")}

          </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                <span>{t("trans_212")}</span>
                <strong>{editDepositSale.totalAmount.toFixed(2)}{t("trans_4")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                <span>{t("trans_213")}</span>
                <strong style={{ color: "var(--warning)" }}>{editDepositSale.remainingAmount?.toFixed(2)}{t("trans_4")}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>{t("trans_214")}</label>
              <input
              type="number"
              className="input-field"
              placeholder={t("trans_215")}
              value={editDepositAmount}
              onChange={(e) => setEditDepositAmount(e.target.value === "" ? "" : Number(e.target.value))}
              autoFocus
              style={{ marginBottom: "1rem" }} />
            
              
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>{t("trans_216")}</label>
              <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setEditDepositScreenshot(e.target.files[0]);
                }
              }}
              className="input-field"
              style={{ marginBottom: "0.5rem", padding: "0.5rem" }} />
            

              {typeof editDepositAmount === 'number' && editDepositAmount > 0 &&
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#10b981", fontWeight: "bold" }}>{t("trans_217")}
              {(editDepositSale.remainingAmount - editDepositAmount).toFixed(2)}{t("trans_4")}
            </div>
            }
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => {setEditDepositSale(null);setEditDepositScreenshot(null);}} disabled={isUpdatingDeposit}>{t("trans_100")}</button>
              <button
              className="btn btn-primary"
              onClick={handleUpdateDeposit}
              disabled={isUpdatingDeposit || editDepositAmount === "" || editDepositAmount <= 0 || !editDepositScreenshot}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              
                {isUpdatingDeposit ? <><Loader2 size={16} className="animate-spin" />{t("trans_218")}</> : t("trans_219")}
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
