import { getServerTranslation } from "@/lib/serverI18n";
import { PrismaClient } from "@prisma/client";
import { Calculator, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import ExpenseShareForm from "./ExpenseShareForm";

const prisma = new PrismaClient();

export default async function AccountingPage() {
  const { t } = await getServerTranslation();
  // Fetch all completed sales and items
  const sales = await prisma.sale.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              product: {
                include: { category: true }
              }
            }
          }
        }
      }
    }
  });

  // Fetch all expenses
  const expenses = await prisma.expense.findMany();

  // Fetch partners
  const partners = await prisma.partner.findMany();

  // Calculate totals
  let totalDiscount = 0;

  // Maps to store partner metrics
  const partnerMetrics = new Map<string, {
    name: string;
    expenseShare: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    specificExpenses: number;
    netProfit: number;
  }>();

  partners.forEach((p) => {
    partnerMetrics.set(p.id, {
      name: p.name,
      expenseShare: p.expenseShare || 0,
      revenue: 0,
      cost: 0,
      grossProfit: 0,
      specificExpenses: 0,
      netProfit: 0
    });
  });

  // 1. Process Sales (Revenue & Cost)
  sales.forEach((sale) => {
    totalDiscount += sale.discountAmount || 0;

    sale.items.forEach((item) => {
      // Only process if not returned
      if (!item.isReturned) {
        const partnerId = item.productVariant.product.category?.partnerId;
        if (partnerId && partnerMetrics.has(partnerId)) {
          const metrics = partnerMetrics.get(partnerId)!;
          metrics.revenue += item.priceAtSale * item.quantity;
          metrics.cost += item.costAtSale * item.quantity;
          metrics.grossProfit = metrics.revenue - metrics.cost;
        }
      }
    });
  });

  // 2. Process Expenses
  let totalGeneralExpenses = 0;

  expenses.forEach((exp) => {
    if (exp.type === "GENERAL") {
      totalGeneralExpenses += exp.amount;
    } else if (exp.type === "PARTNER_SPECIFIC" && exp.partnerId && partnerMetrics.has(exp.partnerId)) {
      partnerMetrics.get(exp.partnerId)!.specificExpenses += exp.amount;
    }
  });

  // Total "General Losses" = General Expenses + Total Discounts
  const totalGeneralLosses = totalGeneralExpenses + totalDiscount;

  // 3. Calculate Net Profit
  let totalNetSystemProfit = 0;

  partnerMetrics.forEach((metrics) => {
    const shareOfGeneralLosses = totalGeneralLosses * (metrics.expenseShare / 100);
    metrics.netProfit = metrics.grossProfit - metrics.specificExpenses - shareOfGeneralLosses;
    totalNetSystemProfit += metrics.netProfit;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calculator size={28} className="text-primary" />{"الحسابات والأرباح"}
        </h1>
      </div>

      {/* Top Overview Cards */}
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9ca3af" }}>
            <TrendingUp size={18} /> <span>{"إجمالي المبيعات (إيرادات)"}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {Array.from(partnerMetrics.values()).reduce((sum, m) => sum + m.revenue, 0).toFixed(2)}{"ج.م"}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9ca3af" }}>
            <TrendingDown size={18} style={{ color: "var(--danger)" }} /> <span>{"إجمالي المصروفات العامة والخصومات"}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--danger)" }}>
            {totalGeneralLosses.toFixed(2)}{"ج.م"}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)" }}>
            <DollarSign size={18} /> <span>{"صافي أرباح النظام الكلي"}</span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: totalNetSystemProfit >= 0 ? "var(--foreground)" : "var(--danger)" }}>
            {totalNetSystemProfit.toFixed(2)}{"ج.م"}
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Setup Shares */}
        <div className="glass-panel" style={{ padding: "1.5rem", height: "fit-content" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieChart size={20} className="text-primary" />{"توزيع المصروفات العامة"}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>{"حدد النسبة المئوية التي يتحملها كل قسم (شريك) من المصروفات العامة (إيجار، كهرباء، خصومات للعملاء...). المجموع يجب أن يكون 100%."}

          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {partners.map((p) =>
            <ExpenseShareForm key={p.id} partner={p} />
            )}
          </div>
          
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>{"المجموع:"}</span>
            <span style={{ color: partners.reduce((sum, p) => sum + (p.expenseShare || 0), 0) === 100 ? "var(--primary)" : "var(--danger)" }}>
              {partners.reduce((sum, p) => sum + (p.expenseShare || 0), 0)}%
            </span>
          </div>
        </div>

        {/* Partners Profit List */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={20} className="text-primary" />{"تفاصيل أرباح الأقسام (الشركاء)"}
          </h2>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"القسم"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"إجمالي المبيعات"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"تكلفة البضاعة"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"مجمل الربح"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"نصيبه من الم.العامة"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"مصروفاته الخاصة"}</th>
                  <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{"صافي الربح"}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(partnerMetrics.values()).map((m) =>
                <tr key={m.name} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "bold", textAlign: "right" }}>{m.name}</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>{m.revenue.toFixed(2)}</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "var(--danger)" }}>{m.cost.toFixed(2)}</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "var(--primary)" }}>{m.grossProfit.toFixed(2)}</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "var(--danger)" }}>{(totalGeneralLosses * (m.expenseShare / 100)).toFixed(2)} ({m.expenseShare}%)</td>
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "var(--danger)" }}>{m.specificExpenses.toFixed(2)}</td>
                    <td style={{ padding: "1rem 0.5rem", fontWeight: "bold", textAlign: "right", color: m.netProfit >= 0 ? "var(--foreground)" : "var(--danger)", fontSize: "1.1rem" }}>
                      {m.netProfit.toFixed(2)}
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
