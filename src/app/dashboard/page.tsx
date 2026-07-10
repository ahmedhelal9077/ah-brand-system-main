import { PrismaClient } from "@prisma/client";
import DashboardClient from "@/components/DashboardClient";

const prisma = new PrismaClient();

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const sp = await searchParams;
  
  // Default to first day of current month and today
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  // handle timezone offset for strings
  const defaultFrom = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const fromDateStr = sp.from || defaultFrom;
  const toDateStr = sp.to || defaultTo;

  const startDate = new Date(fromDateStr);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(toDateStr);
  endDate.setHours(23, 59, 59, 999);

  // Fetch sales in the date range
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      items: {
        include: {
          productVariant: {
            include: { product: true }
          }
        }
      },
      user: true
    }
  });

  let grossSales = 0;
  let totalDiscounts = 0;
  let netSales = 0;
  
  let totalItemsSold = 0;
  let returnsCount = 0;
  let returnsValue = 0;

  const productPerformance: Record<string, { name: string, code: number, quantity: number }> = {};
  const dailyRevenueMap: Record<string, number> = {};
  const employeePerformance: Record<string, { total: number, count: number }> = {};

  sales.forEach(sale => {
    // Financials
    const saleGross = sale.items.reduce((acc, item) => acc + (item.priceAtSale * item.quantity), 0);
    grossSales += saleGross;
    totalDiscounts += (sale.discountAmount || 0);
    netSales += sale.totalAmount;

    // Daily Revenue
    const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
    dailyRevenueMap[dateKey] = (dailyRevenueMap[dateKey] || 0) + sale.totalAmount;

    // Employee Performance
    const empName = sale.user.username;
    if (!employeePerformance[empName]) employeePerformance[empName] = { total: 0, count: 0 };
    employeePerformance[empName].total += sale.totalAmount;
    employeePerformance[empName].count += 1;

    // Items
    sale.items.forEach(item => {
      totalItemsSold += item.quantity;
      if (item.isReturned) {
        returnsCount += item.quantity;
        returnsValue += (item.priceAtSale * item.quantity);
      } else {
        // Product Performance (only for items not returned)
        const pName = item.productVariant.product.name;
        const pCode = item.productVariant.product.code;
        if (!productPerformance[pName]) {
          productPerformance[pName] = { name: pName, code: pCode, quantity: 0 };
        }
        productPerformance[pName].quantity += item.quantity;
      }
    });
  });

  const returnsRatio = totalItemsSold > 0 ? (returnsCount / totalItemsSold) * 100 : 0;

  // Find appended orders in this date range
  const appendActivities = await prisma.activityLog.findMany({
    where: {
      action: "APPEND_TO_SALE",
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const appendedInvoicesMap: Record<string, number> = {};
  appendActivities.forEach(act => {
    const match = act.details.match(/invoice (INV-\d+)/);
    if (match && match[1]) {
      const code = match[1];
      appendedInvoicesMap[code] = (appendedInvoicesMap[code] || 0) + 1;
    }
  });

  // Filter those that have been appended > 0 times (meaning they were appended). 
  // If the user meant "more than once", we could check count > 1. I'll include all that were appended.
  const appendedOrdersData = Object.entries(appendedInvoicesMap)
    .map(([code, count]) => {
      const sale = sales.find(s => s.invoiceCode === code);
      return { 
        invoiceCode: code, 
        timesAppended: count,
        currentStatus: sale?.status || "Unknown",
        originalDate: sale ? new Date(sale.createdAt).toLocaleDateString("ar-EG") : "Unknown"
      };
    })
    .sort((a, b) => b.timesAppended - a.timesAppended);

  const dailyRevenue = Object.entries(dailyRevenueMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sortedProducts = Object.values(productPerformance).sort((a, b) => b.quantity - a.quantity);
  const bestSellers = sortedProducts.slice(0, 5);
  const slowMovers = [...sortedProducts].reverse().slice(0, 5);

  const dashboardData = {
    summary: { totalOrders: sales.length, grossSales, totalDiscounts, netSales, returnsCount, returnsValue, returnsRatio },
    dailyRevenue,
    bestSellers,
    slowMovers,
    employeePerformance,
    appendedOrders: appendedOrdersData
  };

  return <DashboardClient data={dashboardData} initialFrom={fromDateStr} initialTo={toDateStr} />;
}
