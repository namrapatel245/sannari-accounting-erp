import { format, parseISO } from "date-fns";
import { Eye, FileText, Pencil, Search } from "lucide-react";
import { useState } from "react";
import type { AppRoute } from "../../App";
import { PrintInvoice } from "../../components/PrintInvoice";
import { useStore } from "../../store";
import type { Sale } from "../../types";
import { formatCurrency } from "../../utils/helpers";

interface InvoicesProps {
  navigate: (route: AppRoute) => void;
}

function StatusBadge({ status }: { status: Sale["paymentStatus"] }) {
  const styles = {
    Paid: "bg-green-100 text-green-700 border-green-200",
    Unpaid: "bg-red-100 text-red-700 border-red-200",
    Partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function Invoices({ navigate }: InvoicesProps) {
  const { sales, settings, customers } = useStore();
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Sort sales by date descending
  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Filter by bill number or customer name
  const filtered = sortedSales.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.billNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q)
    );
  });

  // Lookup customer phone for display
  function getCustomerPhone(customerId: string): string {
    return customers.find((c) => c.id === customerId)?.phone ?? "";
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {sales.length} invoice{sales.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/sales")}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Invoice
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] mb-4 p-3">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice no. or customer..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Bill #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Payment
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="text-sm">
                        {search
                          ? "No invoices match your search"
                          : "No invoices yet. Create a sale to generate an invoice."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((sale, idx) => {
                  const phone = getCustomerPhone(sale.customerId);
                  return (
                    <tr
                      key={sale.id}
                      className={`border-b border-[#f1f5f9] hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {sale.billNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {format(parseISO(sale.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {sale.customerName}
                          </p>
                          {(sale.customerMobile || phone) && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              📱 {sale.customerMobile || phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span>{sale.paymentMethod}</span>
                          {sale.bankAccountName && (
                            <span className="text-xs text-slate-400">
                              {sale.bankAccountName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={sale.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            title="View Invoice"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/sales")}
                            title="Edit Sale"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[#e2e8f0] bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {filtered.length} of {sales.length} invoices
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Total:{" "}
              {formatCurrency(
                filtered.reduce((sum, s) => sum + s.totalAmount, 0),
              )}
            </p>
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal */}
      {selectedSale && (
        <PrintInvoice
          sale={selectedSale}
          settings={settings}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
