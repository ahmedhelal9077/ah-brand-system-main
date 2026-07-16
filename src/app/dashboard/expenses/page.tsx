import { getServerTranslation } from "@/lib/serverI18n";
import { PrismaClient } from "@prisma/client";
import { createExpense, deleteExpense } from "./actions";
import { Plus, Trash2, Wallet } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";

const prisma = new PrismaClient();

export default async function ExpensesPage() {
  const { t } = await getServerTranslation();
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: {
      partner: true
    }
  });

  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>{t("trans_53")}</h1>
        <a
          href="/api/export?type=expenses"
          target="_blank"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          Excel
        </a>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Add Expense Form */}
        <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={20} className="text-primary" />{t("trans_54")}
          </h2>
          
          <form action={createExpense} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="description">{t("trans_55")}</label>
              <input className="input-field" type="text" id="description" name="description" required placeholder={t("trans_56")} />
            </div>
            
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="amount">{t("trans_57")}</label>
              <input className="input-field" type="number" step="0.01" id="amount" name="amount" required placeholder="0.00" />
            </div>

            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="type">{t("trans_58")}</label>
              <select className="input-field" id="type" name="type" required defaultValue="GENERAL">
                <option value="GENERAL">{t("trans_59")}</option>
                <option value="PARTNER_SPECIFIC">{t("trans_60")}</option>
              </select>
            </div>
            
            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="partnerId">{t("trans_61")}</label>
              <select className="input-field" id="partnerId" name="partnerId">
                <option value="">{t("trans_50")}</option>
                {partners.map((p) =>
                <option key={p.id} value={p.id}>{p.name}</option>
                )}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: "0" }}>
              <label className="input-label" htmlFor="date">{t("trans_62")}</label>
              <input className="input-field" type="date" id="date" name="date" />
              <small style={{ color: "#9ca3af", marginTop: "0.2rem", display: "block" }}>{t("trans_63")}</small>
            </div>
            
            <SubmitButton className="btn btn-primary" style={{ marginTop: "0.5rem" }} pendingText={t("trans_64")}>{t("trans_65")}

            </SubmitButton>
          </form>
        </div>

        {/* Expenses List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Wallet size={20} className="text-primary" />{t("trans_66")}
          </h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{t("trans_67")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{t("trans_68")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{t("trans_69")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{t("trans_70")}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "center" }}>{t("trans_71")}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 &&
                <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>{t("trans_72")}</td>
                  </tr>
                }
                {expenses.map((expense) =>
                <tr key={expense.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      {new Date(expense.date).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "500", textAlign: "right" }}>
                      {expense.description}
                    </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      {expense.type === "GENERAL" ?
                    <span style={{ padding: "0.2rem 0.5rem", background: "var(--primary)", color: "#000", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>{t("trans_73")}</span> :

                    <span style={{ padding: "0.2rem 0.5rem", background: "var(--secondary)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>{t("trans_74")}{expense.partner?.name || t("trans_52")}</span>
                    }
                    </td>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "bold", textAlign: "right" }}>
                      {expense.amount.toFixed(2)}{t("trans_4")}
                  </td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                      <form action={deleteExpense.bind(null, expense.id)} style={{ display: "inline" }}>
                        <button type="submit" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", color: "var(--danger)" }} onClick={(e) => {
                        if (!confirm(t("trans_75"))) e.preventDefault();
                      }}>
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>);

}
