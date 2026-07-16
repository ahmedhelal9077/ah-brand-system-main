"use client";
import { useSettings } from "@/lib/SettingsContext";

import React, { useState } from "react";
import Barcode from "react-barcode";
import { Printer, Search } from "lucide-react";

type Variant = {id: string;barcode: string;colorName: string;stock: number;product: {name: string;code: number;price: number;};};

export default function BarcodesClient({ variants }: {variants: Variant[];}) {
  const { t } = useSettings();
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [copies, setCopies] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("a4");
  const [useStockQuantity, setUseStockQuantity] = useState(true);

  const toggleVariant = (id: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };

  const filteredVariants = variants.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.barcode.includes(q) ||
    v.product.name.toLowerCase().includes(q) ||
    v.colorName.toLowerCase().includes(q) ||
    v.product.code.toString().includes(q);
  });

  const selectedList = variants.filter((v) => selectedVariants.has(v.id));

  const handlePrint = () => {
    const printContent = document.getElementById('printable-barcodes');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const printPageSize = printFormat === "thermal" ? "size: 60mm 40mm;" : "size: A4;";

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            
            .print-container { width: 100%; }

            /* Thermal */
            .thermal .barcode-label {
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              width: 60mm; height: 40mm;
              page-break-after: always; break-after: page;
              margin: 0; padding: 2mm; box-sizing: border-box;
            }
            
            /* A4 Grid */
            .a4 .print-container { padding: 5mm; box-sizing: border-box; }
            .a4 .barcode-label {
              display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
              width: 46%; height: 160px;
              margin: 1% 1.5%; padding: 2mm; box-sizing: border-box;
              page-break-inside: avoid; break-inside: avoid;
              border: 1px dashed #999; vertical-align: top;
            }

            @media print {
              @page { ${printPageSize} margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="${printFormat}">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="no-print" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>Print Barcodes</h1>
          <p style={{ color: "#9ca3af" }}>Select variants below to generate printable barcode labels.</p>
        </div>

        <div className="input-group" style={{ position: "relative", minWidth: "250px", flexGrow: 1, maxWidth: "400px", margin: 0 }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: "2.5rem" }}
            placeholder="Search by Code, Name, Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
          
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", background: "var(--glass-bg)", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
            <button
              onClick={() => setPrintFormat("a4")}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", background: printFormat === "a4" ? "var(--primary)" : "transparent", color: printFormat === "a4" ? "white" : "var(--foreground)", border: "none", cursor: "pointer", transition: "all 0.2s" }}>
              
              A4 Sheet (Grid)
            </button>
            <button
              onClick={() => setPrintFormat("thermal")}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", background: printFormat === "thermal" ? "var(--primary)" : "transparent", color: printFormat === "thermal" ? "white" : "var(--foreground)", border: "none", cursor: "pointer", transition: "all 0.2s" }}>
              
              Thermal 6x4
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--foreground)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={useStockQuantity}
                onChange={(e) => setUseStockQuantity(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }} />{"طباعة نفس الكمية الموجودة في المخزن"}


            </label>

            {!useStockQuantity &&
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.9rem", color: "#9ca3af" }}>Copies:</label>
                <input
                type="number" min="1" max="100"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                className="input-field"
                style={{ width: "70px", padding: "0.5rem", textAlign: "center", margin: 0 }} />
              
              </div>
            }
          </div>

          <button onClick={handlePrint} className="btn btn-secondary" disabled={selectedList.length === 0}>
            Save PDF
          </button>
          <button onClick={handlePrint} className="btn btn-primary" disabled={selectedList.length === 0}>
            <Printer size={18} /> Print {selectedList.length > 0 ? `(${selectedList.reduce((sum, v) => sum + (useStockQuantity ? v.stock || 1 : copies), 0)})` : ""}
          </button>
        </div>
      </div>

      {/* Selection UI */}
      <div className="no-print grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", marginBottom: "2rem" }}>
        {filteredVariants.map((v) =>
        <div key={v.id} onClick={() => toggleVariant(v.id)} className="glass-panel" style={{ padding: "1rem", cursor: "pointer", border: selectedVariants.has(v.id) ? "2px solid var(--primary)" : "1px solid var(--glass-border)", transition: "all 0.2s" }}>
            <div style={{ fontWeight: "bold" }}>{v.product.name}</div>
            <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.5rem" }}>{v.colorName}</div>
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--primary)", marginTop: "0.5rem" }}>#{v.product.code} | {v.barcode}</div>
          </div>
        )}
      </div>

      {/* Printable Area */}
      <div id="printable-barcodes" style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }} className={printFormat}>
        <div className="print-container">
          {selectedList.flatMap((v) => {
            const printCount = useStockQuantity ? v.stock || 1 : copies;
            return Array.from({ length: printCount }).map((_, i) =>
            <div key={`${v.id}-${i}`} className="barcode-label" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "4px", color: "black", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{v.product.name}</div>
                <div style={{ fontSize: "13px", textAlign: "center", marginBottom: "6px", color: "black" }}>{v.colorName}</div>
                <div style={{ display: "flex", justifyContent: "center", transform: "scale(1.1)", transformOrigin: "top center", marginBottom: "4px" }}>
                  <Barcode renderer="svg" value={v.barcode} format="CODE128" width={2} height={50} displayValue={false} background="transparent" lineColor="black" margin={0} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center", color: "black", marginTop: "4px" }}>{"كود:"}{v.product.code}{"|  السعر:"}{v.product.price} EGP</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        #printable-barcodes .barcode-label {
           background: white;
        }
      `}</style>
    </div>);

}
