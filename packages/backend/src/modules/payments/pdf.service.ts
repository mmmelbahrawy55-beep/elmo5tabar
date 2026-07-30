import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PDFService {
  private readonly logger = new Logger(PDFService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePDF(invoiceId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        patient: true,
        payments: { orderBy: { createdAt: 'desc' } },
        discounts: true,
        insurance: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const html = this.renderInvoiceHTML(invoice);
    return {
      invoiceId,
      html,
      format: 'html',
      generatedAt: new Date(),
    };
  }

  async generateReceipt(paymentId: string) {
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: { include: { items: true, patient: true } },
        patient: true,
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    const html = this.renderReceiptHTML(payment);
    return {
      paymentId,
      html,
      format: 'html',
      generatedAt: new Date(),
    };
  }

  async generateRefundReceipt(refundId: string) {
    const refund = await (this.prisma as any).refund.findUnique({
      where: { id: refundId },
      include: {
        payment: { include: { invoice: { include: { patient: true } } } },
        patient: true,
      },
    });
    if (!refund) throw new NotFoundException(`Refund ${refundId} not found`);

    const html = this.renderRefundReceiptHTML(refund);
    return {
      refundId,
      html,
      format: 'html',
      generatedAt: new Date(),
    };
  }

  async generateCorporateStatement(accountId: string, dateFrom: string, dateTo: string) {
    const account = await (this.prisma as any).corporateAccount.findUnique({
      where: { id: accountId },
      include: {
        invoices: {
          where: {
            createdAt: {
              gte: new Date(dateFrom),
              lte: new Date(dateTo),
            },
          },
          include: { invoice: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          where: {
            createdAt: {
              gte: new Date(dateFrom),
              lte: new Date(dateTo),
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);

    const html = this.renderCorporateStatementHTML(account, dateFrom, dateTo);
    return {
      accountId,
      html,
      format: 'html',
      generatedAt: new Date(),
    };
  }

  private renderInvoiceHTML(invoice: Record<string, unknown>): string {
    const patient = invoice.patient as Record<string, unknown>;
    const items = (invoice.items as Array<Record<string, unknown>>) || [];
    const isArabic = invoice.language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';

    const itemRows = items
      .map(
        (item: Record<string, unknown>) => `
        <tr>
          <td>${item.testName || 'N/A'}</td>
          <td>${item.testNameAr || 'N/A'}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${Number(item.unitPrice).toFixed(2)}</td>
          <td class="right">${Number(item.subtotal).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const qrData = this.generateQRData(invoice);

    return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <meta charset="utf-8">
  <title>${isArabic ? 'فاتورة' : 'Invoice'} ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #f5f5f5; padding: 20px; font-size: 14px; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #1a5276, #2980b9); color: white; padding: 30px; text-align: center; position: relative; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; }
    .company-info { text-align: center; margin-top: 10px; font-size: 12px; opacity: 0.8; }
    .invoice-meta { display: flex; justify-content: space-between; padding: 20px 30px; border-bottom: 1px solid #eee; }
    .meta-box { flex: 1; }
    .meta-box h3 { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; }
    .content { padding: 20px 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #1a5276; color: white; padding: 10px 12px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-box { width: 350px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals-row.grand { border-top: 2px solid #1a5276; border-bottom: none; font-weight: bold; font-size: 16px; padding-top: 12px; }
    .qr-section { text-align: center; padding: 20px; border-top: 1px solid #eee; }
    .qr-code { display: inline-block; border: 2px solid #333; padding: 10px; margin-top: 10px; }
    .footer { text-align: center; padding: 20px; background: #f8f9fa; border-top: 1px solid #eee; font-size: 11px; color: #666; }
    .vat-number { font-weight: bold; color: #1a5276; }
    @media print { body { background: white; padding: 0; } .invoice-container { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h2>المختبر | AL MOKHTABAR</h2>
        <p>VAT: 312345678900003</p>
      </div>
      <h1>${isArabic ? 'فاتورة ضريبية' : 'TAX INVOICE'}</h1>
      <p class="subtitle">${invoice.invoiceNumber}</p>
    </div>
    <div class="invoice-meta">
      <div class="meta-box">
        <h3>${isArabic ? 'فاتورة إلى' : 'Bill To'}</h3>
        <p>
          ${patient?.name || 'N/A'}<br>
          ${patient?.email ? `Email: ${patient.email}<br>` : ''}
          ${patient?.phone ? `Phone: ${patient.phone}` : ''}
        </p>
      </div>
      <div class="meta-box">
        <h3>${isArabic ? 'تفاصيل الفاتورة' : 'Invoice Details'}</h3>
        <p>
          <strong>${isArabic ? 'التاريخ' : 'Date'}:</strong> ${new Date(invoice.createdAt as string).toLocaleDateString('en-SA')}<br>
          <strong>${isArabic ? 'الحالة' : 'Status'}:</strong> ${invoice.status}<br>
          ${invoice.dueDate ? `<strong>${isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}:</strong> ${new Date(invoice.dueDate as string).toLocaleDateString('en-SA')}` : ''}
        </p>
      </div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr>
            <th>${isArabic ? 'الاسم بالإنجليزية' : 'Test Name'}</th>
            <th>${isArabic ? 'الاسم بالعربية' : 'Test Name (AR)'}</th>
            <th class="center">${isArabic ? 'الكمية' : 'Qty'}</th>
            <th class="right">${isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
            <th class="right">${isArabic ? 'المجموع' : 'Subtotal'}</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>${isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>${Number(invoice.subtotal).toFixed(2)} SAR</span>
          </div>
          ${Number(invoice.discountAmount) > 0 ? `
          <div class="totals-row">
            <span>${isArabic ? 'الخصم' : 'Discount'}</span>
            <span>-${Number(invoice.discountAmount).toFixed(2)} SAR</span>
          </div>` : ''}
          <div class="totals-row">
            <span>${isArabic ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
            <span>${Number(invoice.taxAmount).toFixed(2)} SAR</span>
          </div>
          ${Number(invoice.insuranceCoverage) > 0 ? `
          <div class="totals-row">
            <span>${isArabic ? 'التغطية التأمينية' : 'Insurance Coverage'}</span>
            <span>-${Number(invoice.insuranceCoverage).toFixed(2)} SAR</span>
          </div>` : ''}
          <div class="totals-row grand">
            <span>${isArabic ? 'الإجمالي' : 'Total'}</span>
            <span>${Number(invoice.total).toFixed(2)} SAR</span>
          </div>
        </div>
      </div>
      <div class="qr-section">
        <p style="font-size:12px;color:#666;">${isArabic ? 'رمز التحقق' : 'Verification QR Code'}</p>
        <div class="qr-code">
          <pre style="font-size:10px;line-height:1.2;">${qrData}</pre>
        </div>
      </div>
    </div>
    <div class="footer">
      <p class="vat-number">VAT Registration: 312345678900003</p>
      <p>${isArabic ? 'هذه فاتورة ضريبية صادرة وفقاً لأحكام هيئة الزكاة والضريبة والجمارك' : 'This is a tax invoice issued in accordance with ZATCA regulations'}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderReceiptHTML(payment: Record<string, unknown>): string {
    const invoice = payment.invoice as Record<string, unknown>;
    const patient = (invoice?.patient as Record<string, unknown>) || payment.patient as Record<string, unknown>;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .receipt-container { max-width: 500px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 25px; text-align: center; }
    .header h2 { font-size: 22px; margin-bottom: 5px; }
    .content { padding: 25px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #eee; font-size: 14px; }
    .row .label { color: #666; }
    .row .value { font-weight: 600; }
    .total-row { border-top: 2px solid #27ae60; border-bottom: none; padding-top: 15px; margin-top: 10px; }
    .total-row .value { font-size: 20px; color: #27ae60; }
    .footer { text-align: center; padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; font-size: 11px; color: #999; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-completed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h2>PAYMENT RECEIPT</h2>
      <p>Al Mokhtabar Laboratory</p>
    </div>
    <div class="content">
      <div class="row">
        <span class="label">Receipt No:</span>
        <span class="value">${payment.id as string}</span>
      </div>
      <div class="row">
        <span class="label">Date:</span>
        <span class="value">${new Date(payment.createdAt as string).toLocaleString('en-SA')}</span>
      </div>
      <div class="row">
        <span class="label">Patient:</span>
        <span class="value">${(patient as Record<string, unknown>)?.name || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Invoice:</span>
        <span class="value">${invoice?.invoiceNumber || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Method:</span>
        <span class="value">${payment.method as string}</span>
      </div>
      <div class="row">
        <span class="label">Status:</span>
        <span class="value"><span class="status-badge status-${(payment.status as string).toLowerCase()}">${payment.status as string}</span></span>
      </div>
      ${payment.cardLast4 ? `
      <div class="row">
        <span class="label">Card:</span>
        <span class="value">****${payment.cardLast4}</span>
      </div>` : ''}
      <div class="row total-row">
        <span class="label">Amount Paid:</span>
        <span class="value">${Number(payment.amount).toFixed(2)} ${payment.currency as string}</span>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your payment</p>
      <p>Al Mokhtabar Laboratory - VAT: 312345678900003</p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderRefundReceiptHTML(refund: Record<string, unknown>): string {
    const payment = refund.payment as Record<string, unknown>;
    const invoice = payment?.invoice as Record<string, unknown>;
    const patient = (invoice?.patient as Record<string, unknown>) || refund.patient as Record<string, unknown>;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .receipt-container { max-width: 500px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 25px; text-align: center; }
    .header h2 { font-size: 22px; margin-bottom: 5px; }
    .content { padding: 25px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #eee; font-size: 14px; }
    .row .label { color: #666; }
    .row .value { font-weight: 600; }
    .total-row { border-top: 2px solid #e74c3c; border-bottom: none; padding-top: 15px; margin-top: 10px; }
    .total-row .value { font-size: 20px; color: #e74c3c; }
    .footer { text-align: center; padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h2>REFUND RECEIPT</h2>
      <p>Al Mokhtabar Laboratory</p>
    </div>
    <div class="content">
      <div class="row">
        <span class="label">Refund ID:</span>
        <span class="value">${refund.id as string}</span>
      </div>
      <div class="row">
        <span class="label">Date:</span>
        <span class="value">${new Date(refund.createdAt as string).toLocaleString('en-SA')}</span>
      </div>
      <div class="row">
        <span class="label">Patient:</span>
        <span class="value">${(patient as Record<string, unknown>)?.name || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Original Payment:</span>
        <span class="value">${payment?.id || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Reason:</span>
        <span class="value">${refund.reason as string || 'N/A'}</span>
      </div>
      <div class="row">
        <span class="label">Status:</span>
        <span class="value">${refund.status as string}</span>
      </div>
      <div class="row total-row">
        <span class="label">Refund Amount:</span>
        <span class="value">${Number(refund.amount).toFixed(2)} ${refund.currency as string}</span>
      </div>
    </div>
    <div class="footer">
      <p>Refund processed by Al Mokhtabar Laboratory</p>
      <p>VAT: 312345678900003</p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderCorporateStatementHTML(
    account: Record<string, unknown>,
    dateFrom: string,
    dateTo: string,
  ): string {
    const invoices = (account.invoices as Array<Record<string, unknown>>) || [];
    const payments = (account.payments as Array<Record<string, unknown>>) || [];

    const invoiceRows = invoices
      .map(
        (ci: Record<string, unknown>) => {
          const inv = ci.invoice as Record<string, unknown>;
          return `
        <tr>
          <td>${inv?.invoiceNumber || 'N/A'}</td>
          <td class="right">${new Date(inv?.createdAt as string).toLocaleDateString('en-SA')}</td>
          <td class="right">${Number(inv?.total || 0).toFixed(2)}</td>
          <td>${ci.status || 'PENDING'}</td>
        </tr>`;
        },
      )
      .join('');

    const paymentRows = payments
      .map(
        (p: Record<string, unknown>) => `
        <tr>
          <td>${p.id as string}</td>
          <td class="right">${new Date(p.createdAt as string).toLocaleDateString('en-SA')}</td>
          <td class="right">${Number(p.amount || 0).toFixed(2)}</td>
          <td>${p.status as string}</td>
        </tr>`,
      )
      .join('');

    const totalInvoiced = invoices.reduce(
      (sum: number, ci: Record<string, unknown>) => {
        const inv = ci.invoice as Record<string, unknown>;
        return sum + (Number(inv?.total || 0));
      },
      0,
    );
    const totalPaid = payments.reduce(
      (sum: number, p: Record<string, unknown>) => sum + Number(p.amount || 0),
      0,
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Corporate Statement - ${account.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #f5f5f5; padding: 20px; }
    .statement-container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #1a5276, #2980b9); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .meta { display: flex; justify-content: space-between; padding: 20px 30px; border-bottom: 1px solid #eee; }
    .meta-box h3 { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; }
    .content { padding: 20px 30px; }
    h3 { font-size: 16px; color: #1a5276; margin: 15px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #1a5276; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .right { text-align: right; }
    .summary { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
    .summary-row.total { border-top: 2px solid #1a5276; padding-top: 10px; margin-top: 5px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="statement-container">
    <div class="header">
      <h1>CORPORATE BILLING STATEMENT</h1>
      <p>${account.companyName as string}</p>
    </div>
    <div class="meta">
      <div class="meta-box">
        <h3>Account Details</h3>
        <p>
          Account: ${account.accountNumber as string}<br>
          Credit Limit: ${Number(account.creditLimit).toFixed(2)} SAR<br>
          Available: ${Number(account.availableCredit).toFixed(2)} SAR
        </p>
      </div>
      <div class="meta-box">
        <h3>Statement Period</h3>
        <p>
          From: ${new Date(dateFrom).toLocaleDateString('en-SA')}<br>
          To: ${new Date(dateTo).toLocaleDateString('en-SA')}
        </p>
      </div>
    </div>
    <div class="content">
      <h3>Invoices</h3>
      <table>
        <thead><tr><th>Invoice #</th><th>Date</th><th class="right">Amount</th><th>Status</th></tr></thead>
        <tbody>${invoiceRows}</tbody>
      </table>
      <h3>Payments</h3>
      <table>
        <thead><tr><th>Payment ID</th><th>Date</th><th class="right">Amount</th><th>Status</th></tr></thead>
        <tbody>${paymentRows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Total Invoiced:</span><span>${totalInvoiced.toFixed(2)} SAR</span></div>
        <div class="summary-row"><span>Total Paid:</span><span>${totalPaid.toFixed(2)} SAR</span></div>
        <div class="summary-row total"><span>Outstanding Balance:</span><span>${(totalInvoiced - totalPaid).toFixed(2)} SAR</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Al Mokhtabar Laboratory - VAT: 312345678900003</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateQRData(invoice: Record<string, unknown>): string {
    const data = JSON.stringify({
      seller: '312345678900003',
      date: invoice.createdAt as string,
      total: invoice.total as number,
      tax: invoice.taxAmount as number,
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 64);
  }
}
