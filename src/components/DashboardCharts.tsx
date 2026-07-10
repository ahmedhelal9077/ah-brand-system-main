"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type EmpData = { name: string; total: number; count: number };

export function EmployeePerformanceChart({ data }: { data: Record<string, { total: number, count: number }> }) {
  const chartData: EmpData[] = Object.entries(data).map(([name, val]) => ({
    name,
    total: val.total,
    count: val.count
  }));

  if (chartData.length === 0) {
    return <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>No data yet.</div>;
  }

  return (
    <div style={{ height: "300px", width: "100%", marginTop: "1rem" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
          <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: "rgba(30, 30, 30, 0.9)", borderColor: "var(--border)", color: "#fff", borderRadius: "8px", backdropFilter: "blur(10px)" }} 
            itemStyle={{ color: "var(--primary)" }}
          />
          <Bar dataKey="total" name="Total Revenue (EGP)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
