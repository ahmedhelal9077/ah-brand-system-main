"use client";
import { useSettings } from "@/lib/SettingsContext";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from
"recharts";
import {
  DollarSign, ShoppingBag, ArrowDownLeft, TrendingUp, TrendingDown, Calendar, Search, Users, RefreshCcw, Percent, Loader2, ShoppingCart } from
"lucide-react";
import { EmployeePerformanceChart } from "./DashboardCharts";

interface DashboardData {
  summary: {
    totalOrders: number;
    grossSales: number;
    totalDiscounts: number;
    netSales: number;
    returnsCount: number;
    returnsValue: number;
    returnsRatio: number;
  };
  dailyRevenue: {date: string;revenue: number;}[];
  bestSellers: {name: string;code: number;quantity: number;}[];
  slowMovers: {name: string;code: number;quantity: number;}[];
  employeePerformance: Record<string, {total: number;count: number;}>;
  appendedOrders: {invoiceCode: string;timesAppended: number;currentStatus: string;originalDate: string;}[];
}

export default function DashboardClient({ data, initialFrom, initialTo }: {data: DashboardData;initialFrom: string;initialTo: string;}) {
  const { t } = useSettings();
  const router = useRouter();
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFiltering(true);
    router.push(`/dashboard?from=${fromDate}&to=${toDate}`);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: "900", letterSpacing: "-0.5px", marginBottom: "0.2rem", color: "var(--foreground)" }}>{t("trans_220")}

          </h1>
        </div>

        <form onSubmit={handleFilter} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "white", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <button type="button" onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setFromDate(today);setToDate(today);
            }} style={{ padding: "0.6rem 1rem", borderRight: "1px solid var(--border)", background: "transparent", borderTop: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer", fontSize: "0.85rem" }}>{t("trans_221")}</button>
            <button type="button" onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              setFromDate(weekAgo);setToDate(today.toISOString().split('T')[0]);
            }} style={{ padding: "0.6rem 1rem", borderRight: "1px solid var(--border)", background: "transparent", borderTop: "none", borderBottom: "none", borderLeft: "none", cursor: "pointer", fontSize: "0.85rem" }}>{t("trans_222")}</button>
            <button type="button" onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
              setFromDate(firstDay);setToDate(today.toISOString().split('T')[0]);
            }} style={{ padding: "0.6rem 1rem", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>{t("trans_223")}</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", background: "white", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "0 0.5rem" }}>
             <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ border: "none", padding: "0.5rem", background: "transparent", outline: "none" }} />
             <span style={{ color: "#aaa" }}>-</span>
             <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ border: "none", padding: "0.5rem", background: "transparent", outline: "none" }} />
          </div>
          <button type="submit" disabled={isFiltering} className="btn" style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            {isFiltering ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        
        {/* Main Sales Chart Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>{t("trans_224")}</h3>
              <div style={{ fontSize: "2.8rem", fontWeight: "900", letterSpacing: "-1px" }}>
                {data.summary.grossSales.toLocaleString()}{t("trans_4")}
              </div>
              <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>{t("trans_225")}
                <strong style={{ color: "var(--foreground)" }}>{data.summary.netSales.toLocaleString()}{t("trans_4")}</strong>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#666", marginBottom: "0.5rem" }}>{t("trans_226")}</h3>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", letterSpacing: "-0.5px" }}>
                {data.summary.returnsValue.toLocaleString()}{t("trans_4")}
              </div>
              <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>{t("trans_227")}
                <strong style={{ color: "var(--foreground)" }}>{data.summary.returnsRatio.toFixed(1)}%</strong>
              </p>
            </div>
          </div>
          
          <div style={{ height: "280px", width: "100%", marginTop: "auto" }}>
            {data.dailyRevenue.length === 0 ?
            <div style={{ textAlign: "center", paddingTop: "5rem", color: "#9ca3af" }}>{t("trans_228")}</div> :

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyRevenue} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <RechartsTooltip
                  cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ backgroundColor: "#1c1c1c", borderColor: "#1c1c1c", color: "#fff", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                  itemStyle={{ color: "var(--primary)", fontWeight: "bold" }} />
                
                  <Line type="monotone" dataKey="revenue" name={t("trans_229")} stroke="var(--primary)" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: "var(--sidebar-bg)", stroke: "var(--primary)", strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Right Side Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ArrowDownLeft size={20} />{t("trans_230")}
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{t("trans_231")}

            </p>
            <div style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-1px" }}>
              {data.summary.totalDiscounts.toLocaleString()}{t("trans_4")}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem", flexGrow: 1 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShoppingCart size={20} />{t("trans_232")}
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{t("trans_233")}

            </p>
            <div style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-1px" }}>
              {data.summary.returnsCount} / {data.summary.totalOrders}{t("trans_234")}
            </div>
          </div>

        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Best and Worst Sellers */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={20} className="text-primary" />{t("trans_235")}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <tbody>
              {data.bestSellers.length === 0 ?
              <tr><td style={{ color: "#9ca3af", textAlign: "center", padding: "1rem" }}>{t("trans_236")}</td></tr> :

              data.bestSellers.map((item, i) =>
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 0" }}>{i + 1}. {item.name} <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>#{item.code}</span></td>
                    <td style={{ padding: "0.8rem 0", fontWeight: "bold", color: "var(--foreground)" }}>{item.quantity}{t("trans_237")}</td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>

        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171" }}>
            <TrendingDown size={20} />{t("trans_238")}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <tbody>
              {data.slowMovers.length === 0 ?
              <tr><td style={{ color: "#9ca3af", textAlign: "center", padding: "1rem" }}>{t("trans_236")}</td></tr> :

              data.slowMovers.map((item, i) =>
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.8rem 0" }}>{item.name} <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>#{item.code}</span></td>
                    <td style={{ padding: "0.8rem 0", fontWeight: "bold", color: "#f87171" }}>{item.quantity}{t("trans_237")}</td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1fr" }}>
        {/* Employee Performance */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={20} className="text-primary" />{t("trans_239")}
          </h2>
          <EmployeePerformanceChart data={data.employeePerformance} />
        </div>
      </div>

      {/* Appended Orders Section */}
      {data.appendedOrders && data.appendedOrders.length > 0 &&
      <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--warning)" }}>{t("trans_240")}

        </h2>
          <div className="glass-panel" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "1rem", textAlign: "right" }}>{t("trans_241")}</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>{t("trans_242")}</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>{t("trans_243")}</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>{t("trans_244")}</th>
                </tr>
              </thead>
              <tbody>
                {data.appendedOrders.map((order) =>
              <tr key={order.invoiceCode} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>{order.invoiceCode}</td>
                    <td style={{ padding: "1rem", color: "var(--warning)", fontWeight: "bold" }}>{order.timesAppended}{t("trans_245")}</td>
                    <td style={{ padding: "1rem", color: "var(--muted)" }}>{order.originalDate}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "1rem",
                    fontSize: "0.8rem",
                    background: order.currentStatus === "PRINTED" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                    color: order.currentStatus === "PRINTED" ? "#22c55e" : "#eab308"
                  }}>
                        {order.currentStatus}
                      </span>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>);

}
