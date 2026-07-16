"use client";

import { useState } from "react";
import { endShift } from "@/app/dashboard/shifts/actions";
import { Clock, DollarSign, LogOut, CheckCircle, AlertTriangle } from "lucide-react";

export default function ShiftsClient({ shifts, userRole, userId }: { shifts: any[]; userRole: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [closingShiftId, setClosingShiftId] = useState<string | null>(null);
  const [actualCash, setActualCash] = useState<number | "">("");

  // Employees see only their shifts, owners see all
  const displayShifts = userRole === "OWNER" ? shifts : shifts.filter(s => s.userId === userId);
  const activeShift = displayShifts.find(s => s.status === "OPEN" && s.userId === userId);

  const handleCloseShift = async (shiftId: string) => {
    if (actualCash === "" || actualCash < 0) {
      alert("الرجاء إدخال المبلغ الفعلي الموجود في الدرج.");
      return;
    }

    setLoading(true);
    const res = await endShift(shiftId, Number(actualCash));
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock color="var(--primary)" /> إدارة الورديات (الشيفتات)
        </h1>
      </div>

      {activeShift && (
        <div className="glass-panel" style={{ marginBottom: "2rem", border: "1px solid var(--primary)", background: "rgba(99, 102, 241, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary)" }}>الوردية الحالية (مفتوحة)</h2>
            <span style={{ background: "var(--primary)", color: "white", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem" }}>قيد التشغيل</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>وقت البدء</div>
              <div style={{ fontWeight: "bold" }}>{new Date(activeShift.startTime).toLocaleString('en-GB')}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>العهدة الافتتاحية</div>
              <div style={{ fontWeight: "bold", color: "var(--success)" }}>{activeShift.startingCash} ج.م</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(99, 102, 241, 0.2)", paddingTop: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                <DollarSign size={18} />
              </span>
              <input
                type="number"
                min="0"
                placeholder="المبلغ الفعلي الموجود في الدرج الآن (ج.م)"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value ? Number(e.target.value) : "")}
                style={{ width: "100%", padding: "0.8rem", paddingLeft: "3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              />
            </div>
            <button
              onClick={() => handleCloseShift(activeShift.id)}
              disabled={loading || actualCash === ""}
              className="btn btn-primary"
              style={{ background: "var(--danger)", color: "white", whiteSpace: "nowrap" }}
            >
              <LogOut size={18} /> تقفيل الوردية
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "1rem" }}>الموظف</th>
              <th style={{ padding: "1rem" }}>البدء</th>
              <th style={{ padding: "1rem" }}>الانتهاء</th>
              <th style={{ padding: "1rem" }}>العهدة</th>
              <th style={{ padding: "1rem" }}>المتوقع</th>
              <th style={{ padding: "1rem" }}>الفعلي</th>
              <th style={{ padding: "1rem" }}>العجز/الزيادة</th>
              <th style={{ padding: "1rem" }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {displayShifts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>لا توجد ورديات مسجلة.</td>
              </tr>
            ) : (
              displayShifts.map(shift => (
                <tr key={shift.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>{shift.user.username}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{new Date(shift.startTime).toLocaleString('en-GB')}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{shift.endTime ? new Date(shift.endTime).toLocaleString('en-GB') : "-"}</td>
                  <td style={{ padding: "1rem", color: "var(--muted)" }}>{shift.startingCash}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>{shift.expectedCash ?? "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>{shift.actualCash ?? "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold", color: shift.shortage === 0 ? "var(--success)" : (shift.shortage || 0) < 0 ? "var(--danger)" : "var(--warning)" }}>
                    {shift.shortage !== null ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        {shift.shortage === 0 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        {shift.shortage}
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ 
                      padding: "0.3rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem",
                      background: shift.status === "OPEN" ? "rgba(99, 102, 241, 0.1)" : "rgba(156, 163, 175, 0.1)",
                      color: shift.status === "OPEN" ? "var(--primary)" : "var(--muted)"
                    }}>
                      {shift.status === "OPEN" ? "مفتوحة" : "مغلقة"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
