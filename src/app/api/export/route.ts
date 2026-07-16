import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sales', 'products', 'expenses'

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type?.toUpperCase() || 'Report');

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        include: {
          user: true,
          items: {
            include: { productVariant: { include: { product: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      worksheet.columns = [
        { header: 'Invoice Code', key: 'invoiceCode', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'Employee', key: 'employee', width: 15 }
      ];

      sales.forEach(sale => {
        worksheet.addRow({
          invoiceCode: sale.invoiceCode || '-',
          date: sale.createdAt.toLocaleString('en-GB'),
          status: sale.status,
          type: sale.type,
          totalAmount: sale.totalAmount,
          customer: sale.customerName || '-',
          phone: sale.customerPhone || '-',
          city: sale.customerCity || '-',
          employee: sale.user.username
        });
      });
    } else if (type === 'products') {
      const variants = await prisma.productVariant.findMany({
        include: { product: { include: { category: true } } },
        orderBy: { product: { name: 'asc' } }
      });

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Wholesale Price', key: 'wholesale', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Barcode', key: 'barcode', width: 20 }
      ];

      variants.forEach(v => {
        worksheet.addRow({
          code: v.product.code,
          name: v.product.name,
          category: v.product.category?.name || 'Uncategorized',
          color: v.colorName,
          price: v.product.price,
          wholesale: v.product.wholesalePrice || 0,
          stock: v.stock,
          barcode: v.barcode
        });
      });
    } else if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        include: { partner: true },
        orderBy: { date: 'desc' }
      });

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Description', key: 'desc', width: 40 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Partner', key: 'partner', width: 20 }
      ];

      expenses.forEach(e => {
        worksheet.addRow({
          date: e.date.toLocaleString('en-GB'),
          desc: e.description,
          amount: e.amount,
          type: e.type,
          partner: e.partner?.name || '-'
        });
      });
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Styling headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_report.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
