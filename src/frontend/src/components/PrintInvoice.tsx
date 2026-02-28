import { format, parseISO } from "date-fns";
import { MessageCircle, Printer, X } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useStore } from "../store";
import type { Sale, Settings } from "../types";
import { formatCurrency } from "../utils/helpers";

interface PrintInvoiceProps {
  sale: Sale;
  settings: Settings;
  onClose: () => void;
}

export function PrintInvoice({ sale, settings, onClose }: PrintInvoiceProps) {
  const { customers } = useStore();
  const invoiceRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const element = document.getElementById("print-invoice-content");
    if (!element) {
      toast.error("Invoice content not found.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error(
        "Pop-up blocked. Please allow pop-ups for this site and try again.",
      );
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${sale.billNumber}</title>
  <style>
    ${styles}
    body { margin: 0; padding: 0; background: white; font-family: sans-serif; }
    @page { margin: 10mm; }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>`);
    printWindow.document.close();

    // Wait for images/fonts to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }

  function handleWhatsApp() {
    // Determine phone: customerMobile on sale > customer phone > settings whatsappNumber
    const customer = customers.find((c) => c.id === sale.customerId);
    const phone =
      sale.customerMobile || customer?.phone || settings.whatsappNumber;

    if (!phone) {
      toast.warning(
        "No WhatsApp number available. Add customer mobile in the sale form, or set WhatsApp number in Settings.",
      );
      return;
    }

    const element = document.getElementById("print-invoice-content");
    if (!element) {
      toast.error("Invoice content not found.");
      return;
    }

    // Open a print window — user saves as PDF, then we open WhatsApp
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error(
        "Pop-up blocked. Please allow pop-ups for this site and try again.",
      );
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${sale.billNumber}</title>
  <style>
    ${styles}
    body { margin: 0; padding: 0; background: white; font-family: sans-serif; }
    @page { margin: 10mm; }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>`);
    printWindow.document.close();

    // After print dialog, open WhatsApp
    const cleanPhone = phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/${cleanPhone}`;

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Open WhatsApp after a short delay to let print dialog open first
        setTimeout(() => {
          window.open(waUrl, "_blank", "noopener,noreferrer");
          toast.success("Save the invoice as PDF, then send it via WhatsApp.");
        }, 800);
      }, 500);
    };
  }

  const taxableAmount = sale.subtotal - sale.discountTotal;
  const cgst = sale.gstTotal / 2;
  const sgst = sale.gstTotal / 2;

  // Business initials for logo placeholder
  const initials = settings.businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const modal = (
    <>
      {/* Modal Overlay */}
      <div
        id="print-invoice-modal"
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
          {/* Controls */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-base font-semibold text-slate-800">
              Invoice Preview
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
              >
                <MessageCircle size={15} /> Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Printer size={15} /> Print Invoice
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Invoice Content — captured for PDF */}
          <div
            id="print-invoice-content"
            ref={invoiceRef}
            className="print-page p-8 bg-white"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg leading-none">
                      {initials}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {settings.businessName}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1 max-w-[280px]">
                    {settings.address}
                  </p>
                  <p className="text-sm text-slate-600">Ph: {settings.phone}</p>
                  {settings.gst && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {settings.gst}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {settings.businessType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-2">
                  <p className="text-xs font-medium opacity-80">TAX INVOICE</p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-600">Invoice No:</p>
                  <p className="font-bold text-slate-900 font-mono">
                    {sale.billNumber}
                  </p>
                </div>
                <div className="text-sm mt-2">
                  <p className="text-slate-600">Date:</p>
                  <p className="font-semibold text-slate-800">
                    {format(parseISO(sale.date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-blue-600 mb-4" />

            {/* Customer Details */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Bill To
              </h3>
              <p className="text-base font-semibold text-slate-900">
                {sale.customerName}
              </p>
              {sale.customerMobile && (
                <p className="text-sm text-slate-600 mt-0.5">
                  📱 {sale.customerMobile}
                </p>
              )}
              {sale.narration && (
                <p className="text-sm text-slate-600 mt-0.5">
                  {sale.narration}
                </p>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-5 border border-slate-200 rounded overflow-hidden">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="text-left px-3 py-2 text-xs font-semibold w-6">
                    #
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold">
                    Item Description
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold">
                    HSN
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    Qty
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    Rate
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    Disc
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    GST%
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    GST Amt
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr
                    key={`${item.productId}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2 text-slate-500 font-mono">
                      {item.hsnCode || "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {item.discount > 0 ? formatCurrency(item.discount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {item.gstPercent}%
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatCurrency(item.gstAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-5">
              <div className="w-64">
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-slate-600">Discount:</span>
                    <span className="font-medium text-red-600">
                      - {formatCurrency(sale.discountTotal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-600">Taxable Amount:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(taxableAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-600">CGST:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(cgst)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-600">SGST:</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(sgst)}
                  </span>
                </div>
                <div className="border-t-2 border-slate-700 pt-2 mt-1 flex justify-between">
                  <span className="text-base font-bold text-slate-900">
                    Grand Total:
                  </span>
                  <span className="text-base font-bold text-blue-700">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between mb-5 p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Payment Mode:{" "}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {sale.paymentMethod}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Status:{" "}
                </span>
                <span
                  className={`text-sm font-bold ${
                    sale.paymentStatus === "Paid"
                      ? "text-green-600"
                      : sale.paymentStatus === "Unpaid"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {sale.paymentStatus}
                </span>
              </div>
            </div>

            {/* Terms */}
            {settings.termsConditions && (
              <div className="border-t border-[#e2e8f0] pt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Terms & Conditions
                </h4>
                <p className="text-xs text-slate-500">
                  {settings.termsConditions}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[#e2e8f0] mt-4 pt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Thank you for your business!
              </p>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-4">
                  Authorised Signatory
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {settings.businessName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
