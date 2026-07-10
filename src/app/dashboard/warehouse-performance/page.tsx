import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Activity, Clock, Package, User } from "lucide-react";

const prisma = new PrismaClient();

export default async function WarehousePerformancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = sp.date || todayStr;
  
  const selectedDate = new Date(selectedDateStr);
  selectedDate.setHours(0, 0, 0, 0);
  
  const nextDate = new Date(selectedDate);
  nextDate.setDate(selectedDate.getDate() + 1);

  // Fetch all pack activities for the selected date
  const activities = await prisma.activityLog.findMany({
    where: {
      action: "ORDER_PACKED",
      createdAt: {
        gte: selectedDate,
        lt: nextDate
      }
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  // Group by user
  const performanceMap: Record<string, { username: string, count: number, firstPack: Date | null, lastPack: Date | null }> = {};

  activities.forEach(log => {
    if (!performanceMap[log.userId]) {
      performanceMap[log.userId] = {
        username: log.user.username,
        count: 0,
        firstPack: log.createdAt,
        lastPack: log.createdAt
      };
    }
    
    const userStats = performanceMap[log.userId];
    userStats.count += 1;
    userStats.lastPack = log.createdAt;
  });

  const performanceList = Object.values(performanceMap).sort((a, b) => b.count - a.count);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={28} />
            أداء المخزن (التجهيز)
          </h1>
          <p style={{ color: "#9ca3af" }}>متابعة إنتاجية موظفي المخزن ومعدلات التقفيل.</p>
        </div>
        
        <form action="/dashboard/warehouse-performance" method="GET" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ color: "#9ca3af", fontWeight: "bold" }}>التاريخ:</label>
          <input 
            type="date" 
            name="date" 
            defaultValue={selectedDateStr} 
            className="input-field" 
            style={{ width: "auto" }}
          />
          <button type="submit" className="btn btn-primary">عرض</button>
        </form>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {performanceList.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            لا يوجد عمليات تقفيل مسجلة في هذا اليوم.
          </div>
        ) : (
          <div className="glass-panel" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "#9ca3af" }}>
                  <th style={{ padding: "1rem" }}>الموظف</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>إجمالي الفواتير المجهزة</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>أول أوردر (بداية الشغل)</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>آخر أوردر (آخر تحديث)</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>متوسط الوقت بين الأوردرات</th>
                </tr>
              </thead>
              <tbody>
                {performanceList.map((stat, i) => {
                  let avgTimeStr = "أوردر واحد فقط";
                  if (stat.count > 1 && stat.firstPack && stat.lastPack) {
                    const diffMs = stat.lastPack.getTime() - stat.firstPack.getTime();
                    const diffMins = Math.floor(diffMs / 1000 / 60);
                    const avgMins = Math.round(diffMins / (stat.count - 1));
                    
                    if (avgMins === 0) avgTimeStr = "أقل من دقيقة";
                    else avgTimeStr = `${avgMins} دقيقة / أوردر`;
                  }

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={18} color="var(--primary)" /> {stat.username}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold", fontSize: "1.2rem", color: "var(--accent)" }}>
                        {stat.count}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
                        {stat.firstPack?.toLocaleTimeString("ar-EG")}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
                        {stat.lastPack?.toLocaleTimeString("ar-EG")}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", color: "var(--warning)" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "rgba(245, 158, 11, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>
                          <Clock size={14} /> {avgTimeStr}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
