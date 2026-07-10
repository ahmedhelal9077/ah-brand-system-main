import { PrismaClient } from "@prisma/client";
import { createProduct, toggleProductActive } from "./actions";
import { Package, Plus, EyeOff, Eye, Palette } from "lucide-react";
import Link from "next/link";
import { getServerTranslation } from "@/lib/serverI18n";
import DeleteProductButton from "@/components/DeleteProductButton";
import EditProductBtn from "@/components/dashboard/EditProductBtn";
import QuickAddModalBtn from "@/components/dashboard/QuickAddModalBtn";
import SubmitButton from "@/components/SubmitButton";
import ProductsListClient from "@/components/dashboard/ProductsListClient";

const prisma = new PrismaClient();

export default async function ProductsPage() {
  const { t } = await getServerTranslation();
  const products = await prisma.product.findMany({
    include: { 
      category: true,
      variants: {
        select: { stock: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>{t("productsManagement")}</h1>
        <QuickAddModalBtn categories={categories} />
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Add Product Form */}
        <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={20} className="text-primary" /> {t("addProduct")}
          </h2>
          
          <form action={createProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="name">{t("bagName")}</label>
              <input className="input-field" type="text" id="name" name="name" required />
            </div>
            
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="price">{t("priceEgp")}</label>
              <input className="input-field" type="number" step="0.01" id="price" name="price" required placeholder="0.00" />
            </div>
            
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="categoryId">{t("categories")}</label>
              <select className="input-field" id="categoryId" name="categoryId">
                <option value="">{t("noCategory")}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="code">الكود (اختياري)</label>
              <input className="input-field" type="number" id="code" name="code" placeholder="تلقائي" />
            </div>
            
            <SubmitButton className="btn btn-primary" style={{ marginTop: "0.5rem" }} pendingText={t("processing") || "جاري الحفظ..."}>
              {t("addProduct")}
            </SubmitButton>
          </form>
        </div>

        {/* Products List (Client Component with Pagination and Search) */}
        <ProductsListClient 
          products={products} 
          categories={categories} 
          translations={{
            productCatalog: t("productCatalog"),
            code: t("code"),
            name: t("name"),
            categories: t("categories"),
            price: t("price"),
            variants: t("variants"),
            actions: t("actions"),
            uncategorized: t("uncategorized"),
            available: t("available")
          }} 
        />

      </div>
    </div>
  );
}
