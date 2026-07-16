"use client";

import { useSettings } from "@/lib/SettingsContext";

type ActivityLog = {
  id: string;
  createdAt: Date;
  action: string;
  details: string;
  user: {username: string;};
};

const translateLog = (text: string, lang: string) => {
  if (lang !== "ar") return text;

  return text.
  replace(/Processed sale for/g, t("trans_18")).
  replace(/items/g, t("trans_19")).
  replace(/Total:/g, t("trans_20")).
  replace(/Invoice:/g, t("trans_21")).
  replace(/Processed return for/g, t("trans_22")).
  replace(/Refunded/g, t("trans_23")).
  replace(/Reason:/g, t("trans_24")).
  replace(/User logged in/g, t("trans_25")).
  replace(/Added new product/g, t("trans_26")).
  replace(/Updated product/g, t("trans_27")).
  replace(/Deleted product/g, t("trans_28")).
  replace(/Added variant/g, t("trans_29")).
  replace(/Code:/g, t("trans_30")).
  replace(/Color:/g, t("trans_31")).
  replace(/Processed online order for/g, t("trans_32")).
  replace(/Reserved/g, t("trans_33")).
  replace(/for 1 days/g, t("trans_34"));
};

const translateAction = (action: string, lang: string) => {
  if (lang !== "ar") return action;

  const map: Record<string, string> = {
    "LOGIN": t("trans_35"),
    "SALE": t("trans_36"),
    "RETURN": t("trans_37"),
    "ADD_PRODUCT": t("trans_38"),
    "EDIT_PRODUCT": t("trans_39"),
    "DELETE_PRODUCT": t("trans_40"),
    "ADD_VARIANT": t("trans_41"),
    "ONLINE_ORDER": t("trans_42"),
    "RESERVATION": t("trans_43")
  };
  return map[action] || action;
};

export default function ActivityClient({ logs }: {logs: ActivityLog[];}) {
  const { t, language } = useSettings();

  return (
    <div className="glass-panel" style={{ overflowX: "auto" }}>
      <table className="table" style={{ width: "100%", textAlign: language === "ar" ? "right" : "left", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("time" as any) || (language === "ar" ? t("trans_44") : "Time")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("user" as any) || (language === "ar" ? t("trans_45") : "User")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("action" as any) || (language === "ar" ? t("trans_46") : "Action")}</th>
            <th style={{ padding: "1rem", color: "#9ca3af" }}>{t("details" as any) || (language === "ar" ? t("trans_47") : "Details")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 &&
          <tr><td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>{language === "ar" ? t("trans_48") : "No activity yet."}</td></tr>
          }
          {logs.map((log) =>
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
          )}
        </tbody>
      </table>
    </div>);

}
