import { PrismaClient } from "@prisma/client";
import { createCategory, deleteCategory } from "./actions";
import { Tags, Plus, Trash2 } from "lucide-react";
import { getServerTranslation } from "@/lib/serverI18n";
import SubmitButton from "@/components/SubmitButton";

const prisma = new PrismaClient();

export default async function CategoriesPage() {
  const { t } = await getServerTranslation();
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{t("categoriesManagement")}</h1>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Add Category Form */}
        <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={20} className="text-primary" /> {t("addCategory")}
          </h2>
          
          <form action={createCategory} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="name">{t("categoryName")}</label>
              <input className="input-field" type="text" id="name" name="name" required />
            </div>
            
            <SubmitButton className="btn btn-primary" style={{ marginTop: "0.5rem" }} pendingText={t("processing") || "جاري التحميل..."}>
              {t("addCategory")}
            </SubmitButton>
          </form>
        </div>

        {/* Categories List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Tags size={20} className="text-primary" /> {t("categories")}
          </h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "start" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{t("name")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "start" }}>{t("totalProducts")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "end" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>{t("noCategoriesFound")}</td>
                  </tr>
                )}
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "bold" }}>{cat.name}</td>
                    <td style={{ padding: "1rem 0.5rem" }}>
                      <span style={{ background: "var(--secondary)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem" }}>
                        {cat._count.products}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "end" }}>
                      {cat._count.products === 0 ? (
                        <form action={deleteCategory.bind(null, cat.id)}>
                          <SubmitButton className="btn btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                            <Trash2 size={14} />
                          </SubmitButton>
                        </form>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{t("cannotDelete")}</span>
                      )}
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
