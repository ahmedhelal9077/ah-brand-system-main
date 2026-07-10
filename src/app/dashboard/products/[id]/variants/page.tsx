import { PrismaClient } from "@prisma/client";
import { createVariant, updateStock } from "./actions";
import { ArrowLeft, Plus, Trash2, Barcode } from "lucide-react";
import Link from "next/link";
import VariantForm from "@/components/VariantForm";
import DeleteVariantBtn from "@/components/dashboard/DeleteVariantBtn";
// using a simple barcode component or just displaying the number for now
// To use react-barcode we'd need a client component, we'll keep it simple here.

const prisma = new PrismaClient();

export default async function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  });

  if (!product) return <div>Product not found</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/dashboard/products" className="btn btn-secondary" style={{ padding: "0.5rem" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.2rem" }}>{product.name} - Colors & Variants</h1>
          <p style={{ color: "#9ca3af" }}>Product Code: #{product.code} | Price: {product.price}</p>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Add Variant Form */}
        <VariantForm productId={product.id} />

        {/* Variants List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Barcode size={20} className="text-primary" /> Current Variants & Barcodes
          </h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem 0.5rem" }}>Color</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Stock</th>
                  <th style={{ padding: "1rem 0.5rem" }}>Barcode</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No variants added yet.</td>
                  </tr>
                )}
                {product.variants.map((variant) => (
                  <tr key={variant.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "500", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {variant.colorHex && (
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: variant.colorHex, border: "1px solid #fff" }} />
                      )}
                      {variant.colorName}
                    </td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      <form action={updateStock.bind(null, variant.id, product.id, variant.stock + 1)} style={{ display: "inline" }}>
                        <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem" }}>+</button>
                      </form>
                      <span style={{ margin: "0 0.8rem", fontWeight: "bold", color: variant.stock === 0 ? "var(--danger)" : variant.stock <= 3 ? "var(--warning)" : "var(--foreground)" }}>
                        {variant.stock}
                      </span>
                      <form action={updateStock.bind(null, variant.id, product.id, Math.max(0, variant.stock - 1))} style={{ display: "inline" }}>
                        <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem" }}>-</button>
                      </form>
                    </td>
                    <td style={{ padding: "1rem 0.5rem", fontFamily: "monospace" }}>
                      {variant.barcode}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      <DeleteVariantBtn variantId={variant.id} productId={product.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
