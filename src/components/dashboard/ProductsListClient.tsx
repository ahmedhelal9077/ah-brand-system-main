"use client";

import { useState } from "react";
import { Package, EyeOff, Eye, Palette } from "lucide-react";
import Link from "next/link";
import DeleteProductButton from "@/components/DeleteProductButton";
import EditProductBtn from "@/components/dashboard/EditProductBtn";
import SubmitButton from "@/components/SubmitButton";
import { toggleProductActive } from "@/app/dashboard/products/actions";

export default function ProductsListClient({ products, categories, translations }: { products: any[], categories: any[], translations: Record<string, string> }) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(prod => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      prod.name.toLowerCase().includes(q) ||
      (prod.code && prod.code.toString().includes(q)) ||
      (prod.category?.name && prod.category.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <Package size={20} className="text-primary" /> {translations.productCatalog}
        </h2>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a
            href="/api/export?type=products"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
          >
            Excel
          </a>
          <input 
            type="search" 
            placeholder="بحث بالاسم، الكود، التصنيف..." 
            className="input-field"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(30); }}
            style={{ maxWidth: "300px", margin: 0 }}
          />
        </div>
      </div>
      
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "start" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
              <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{translations.code}</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{translations.name}</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{translations.categories}</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{translations.price}</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{translations.variants}</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "end" }}>{translations.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>لا يوجد منتجات تطابق البحث</td>
              </tr>
            )}
            {filteredProducts.slice(0, visibleCount).map((prod) => {
              const totalStock = prod.variants.reduce((acc: number, v: any) => acc + v.stock, 0);
              
              return (
                <tr key={prod.id} style={{ borderBottom: "1px solid var(--border)", opacity: prod.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: "1rem 0.5rem", fontFamily: "monospace", color: "var(--primary)" }}>#{prod.code}</td>
                  <td style={{ padding: "1rem 0.5rem", fontWeight: "500" }}>{prod.name} {!prod.isActive && <span style={{fontSize: '0.7rem', padding: '2px 6px', background: 'var(--danger)', color: 'white', borderRadius: '4px', marginLeft: '8px'}}>Archived</span>}</td>
                  <td style={{ padding: "1rem 0.5rem" }}>{prod.category?.name || translations.uncategorized}</td>
                  <td style={{ padding: "1rem 0.5rem" }}>{prod.price}</td>
                  <td style={{ padding: "1rem 0.5rem" }}>
                    <span style={{ 
                      color: totalStock <= 3 && totalStock > 0 ? "var(--warning)" : totalStock === 0 ? "var(--danger)" : "var(--accent)"
                    }}>
                      {prod.variants.length} لون ({totalStock} {translations.available})
                    </span>
                  </td>
                  <td style={{ padding: "1rem 0.5rem", textAlign: "end", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <Link href={`/dashboard/products/${prod.id}/variants`} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                      <Palette size={14} /> {translations.variants}
                    </Link>
                    <EditProductBtn product={prod} categories={categories} />
                    <form action={toggleProductActive.bind(null, prod.id)}>
                      <SubmitButton className={`btn ${prod.isActive ? 'btn-danger' : 'btn-primary'}`} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} title={prod.isActive ? "Hide / Archive" : "Show / Unarchive"}>
                        {prod.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </SubmitButton>
                    </form>
                    <DeleteProductButton productId={prod.id} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {visibleCount < filteredProducts.length && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 30)} 
          className="btn btn-secondary" 
          style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", border: "1px dashed var(--border)" }}
        >
          عرض المزيد...
        </button>
      )}
    </div>
  );
}
