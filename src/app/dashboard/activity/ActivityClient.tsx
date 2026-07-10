"use client";

import { useSettings } from "@/lib/SettingsContext";

type ActivityLog = {
  id: string;
  createdAt: Date;
  action: string;
  details: string;
  user: { username: string };
};

const translateLog = (text: string, lang: string) => {
  if (lang !== "ar") return text;
  
  return text
    .replace(/Processed sale for/g, "تم تسجيل بيع لـ")
    .replace(/items/g, "عناصر")
    .replace(/Total:/g, "الإجمالي:")
    .replace(/Invoice:/g, "كود الفاتورة:")
    .replace(/Processed return for/g, "تم إرجاع")
    .replace(/Refunded/g, "تم استرداد مبلغ")
    .replace(/Reason:/g, "السبب:")
    .replace(/User logged in/g, "تم تسجيل الدخول")
    .replace(/Added new product/g, "تمت إضافة منتج جديد")
    .replace(/Updated product/g, "تم تعديل منتج")
    .replace(/Deleted product/g, "تم حذف منتج")
    .replace(/Added variant/g, "تمت إضافة صنف/لون")
    .replace(/Code:/g, "كود:")
    .replace(/Color:/g, "اللون:")
    .replace(/Processed online order for/g, "تم تسجيل أوردر أونلاين لـ")
    .replace(/Reserved/g, "تم حجز")
    .replace(/for 1 days/g, "لمدة يوم واحد");
};

const translateAction = (action: string, lang: string) => {
  if (lang !== "ar") return action;
  
  const map: Record<string, string> = {
    "LOGIN": "تسجيل دخول",
    "SALE": "عملية بيع",
    "RETURN": "إرجاع",
    "ADD_PRODUCT": "إضافة منتج",
    "EDIT_PRODUCT": "تعديل منتج",
    "DELETE_PRODUCT": "حذف منتج",
    "ADD_VARIANT": "إضافة صنف",
    "ONLINE_ORDER": "أونلاين",
    "RESERVATION": "حجز"
  };
  return map[action] || action;
};

export default function ActivityClient({ logs }: { logs: ActivityLog[] }) {
  const { t, language } = useSettings();

  return (
    <div className="glass-panel" style={{ overflowX: "auto" }}>
      <table className="table" style={{ width: "100%", textAlign: language === "ar" ? "right" : "left", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("time" as any) || (language === "ar" ? "الوقت" : "Time")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("user" as any) || (language === "ar" ? "المستخدم" : "User")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("action" as any) || (language === "ar" ? "الإجراء" : "Action")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("details" as any) || (language === "ar" ? "التفاصيل" : "Details")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr><td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>{language === "ar" ? "لا يوجد نشاطات مسجلة." : "No activity yet."}</td></tr>
          )}
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover-bg">
              <td style={{ padding: "1rem", whiteSpace: "nowrap", direction: "ltr", textAlign: language === "ar" ? "right" : "left" }}>
                {log.createdAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td style={{ padding: "1rem", fontWeight: "bold", color: "var(--primary)" }}>{log.user.username}</td>
              <td style={{ padding: "1rem" }}>
                <span style={{ padding: "0.2rem 0.5rem", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "#fff" }}>
                  {translateAction(log.action, language)}
                </span>
              </td>
              <td style={{ padding: "1rem", color: "#d1d5db" }}>
                {translateLog(log.details, language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
