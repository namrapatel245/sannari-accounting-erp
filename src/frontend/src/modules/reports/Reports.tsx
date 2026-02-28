import { format, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../../store";
import {
  downloadJSON,
  formatCurrency,
  getLast12Months,
  isInDateRange,
  isInMonth,
} from "../../utils/helpers";

const COLORS = [
  "#1e40af",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#be185d",
];

type ReportTab = "sales" | "purchase" | "pnl" | "stock" | "expense" | "monthly";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-700 mb-3">{children}</h3>
  );
}

export function Reports() {
  const { sales, purchases, expenses, products } = useStore();
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = useMemo(() => getLast12Months(), []);
  const formatCurrencyShort = (v: number) =>
    v >= 100000
      ? `₹${(v / 100000).toFixed(1)}L`
      : v >= 1000
        ? `₹${(v / 1000).toFixed(1)}K`
        : `₹${v}`;

  // Sales Report
  const filteredSales = useMemo(
    () =>
      sales
        .filter((s) => isInDateRange(s.date, dateFrom, dateTo))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [sales, dateFrom, dateTo],
  );
  const salesByMonth = useMemo(
    () =>
      months.map(({ month, year, label }) => ({
        label,
        Amount: sales
          .filter((s) => isInMonth(s.date, month, year))
          .reduce((a, x) => a + x.totalAmount, 0),
      })),
    [months, sales],
  );

  // Purchase Report
  const filteredPurchases = useMemo(
    () =>
      purchases
        .filter((p) => isInDateRange(p.date, dateFrom, dateTo))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, dateFrom, dateTo],
  );
  const purchasesByMonth = useMemo(
    () =>
      months.map(({ month, year, label }) => ({
        label,
        Amount: purchases
          .filter((p) => isInMonth(p.date, month, year))
          .reduce((a, x) => a + x.totalAmount, 0),
      })),
    [months, purchases],
  );

  // P&L Report
  const pnlData = useMemo(
    () =>
      months.map(({ month, year, label }) => {
        const s = sales
          .filter((x) => isInMonth(x.date, month, year))
          .reduce((a, x) => a + x.totalAmount, 0);
        const p = purchases
          .filter((x) => isInMonth(x.date, month, year))
          .reduce((a, x) => a + x.totalAmount, 0);
        const e = expenses
          .filter((x) => isInMonth(x.date, month, year))
          .reduce((a, x) => a + x.amount, 0);
        return {
          label,
          Sales: s,
          Purchases: p,
          Expenses: e,
          "Gross Profit": s - p,
          "Net Profit": s - p - e,
        };
      }),
    [months, sales, purchases, expenses],
  );

  // Expense Report
  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isInDateRange(e.date, dateFrom, dateTo))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, dateFrom, dateTo],
  );
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // Monthly Summary
  const monthlySummaryData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i;
      const y = selectedYear;
      const label = format(new Date(y, m, 1), "MMM");
      const s = sales
        .filter((x) => isInMonth(x.date, m, y))
        .reduce((a, x) => a + x.totalAmount, 0);
      const p = purchases
        .filter((x) => isInMonth(x.date, m, y))
        .reduce((a, x) => a + x.totalAmount, 0);
      const e = expenses
        .filter((x) => isInMonth(x.date, m, y))
        .reduce((a, x) => a + x.amount, 0);
      return {
        label,
        Sales: s,
        Purchases: p,
        Expenses: e,
        "Net Profit": s - p - e,
      };
    });
  }, [selectedYear, sales, purchases, expenses]);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "sales", label: "Sales Report" },
    { key: "purchase", label: "Purchase Report" },
    { key: "pnl", label: "Profit & Loss" },
    { key: "stock", label: "Stock Report" },
    { key: "expense", label: "Expense Report" },
    { key: "monthly", label: "Monthly Summary" },
  ];

  function handleExport() {
    const data: Record<string, unknown> = {};
    if (activeTab === "sales") data.sales = filteredSales;
    else if (activeTab === "purchase") data.purchases = filteredPurchases;
    else if (activeTab === "pnl") data.pnl = pnlData;
    else if (activeTab === "stock") data.stock = products;
    else if (activeTab === "expense") data.expenses = filteredExpenses;
    else if (activeTab === "monthly") data.monthly = monthlySummaryData;
    downloadJSON(
      data,
      `sannari_${activeTab}_report_${format(new Date(), "yyyy-MM-dd")}.json`,
    );
  }

  const DateFilters = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400"
      />
      <span className="text-slate-400 text-sm">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400"
      />
      {(dateFrom || dateTo) && (
        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Clear
        </button>
      )}
    </div>
  );

  const ReportActions = () => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Download size={14} /> Export JSON
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e2e8f0] text-sm text-slate-600 rounded hover:bg-slate-50"
      >
        <Printer size={14} /> Print
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#e2e8f0] px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Sales Report */}
          {activeTab === "sales" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <SectionTitle>Sales Report</SectionTitle>
                  <DateFilters />
                </div>
                <ReportActions />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByMonth} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    tick={{ fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Amount" fill="#1e40af" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-sm">
                <div className="bg-blue-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Total: </span>
                  <strong className="text-blue-700">
                    {formatCurrency(
                      filteredSales.reduce((s, x) => s + x.totalAmount, 0),
                    )}
                  </strong>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Count: </span>
                  <strong>{filteredSales.length}</strong>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Avg: </span>
                  <strong>
                    {formatCurrency(
                      filteredSales.length
                        ? filteredSales.reduce((s, x) => s + x.totalAmount, 0) /
                            filteredSales.length
                        : 0,
                    )}
                  </strong>
                </div>
              </div>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Bill#</th>
                      <th className="text-left">Customer</th>
                      <th className="text-left">Items</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.slice(0, 50).map((s) => (
                      <tr key={s.id}>
                        <td>{format(parseISO(s.date), "dd MMM yyyy")}</td>
                        <td className="font-mono text-blue-700">
                          {s.billNumber}
                        </td>
                        <td className="font-medium">{s.customerName}</td>
                        <td className="text-slate-500">
                          {s.items.map((i) => i.productName).join(", ")}
                        </td>
                        <td className="text-right text-green-700 font-semibold">
                          {formatCurrency(s.totalAmount)}
                        </td>
                        <td>{s.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase Report */}
          {activeTab === "purchase" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <SectionTitle>Purchase Report</SectionTitle>
                  <DateFilters />
                </div>
                <ReportActions />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={purchasesByMonth} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    tick={{ fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Amount" fill="#ea580c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-sm">
                <div className="bg-orange-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Total: </span>
                  <strong className="text-orange-700">
                    {formatCurrency(
                      filteredPurchases.reduce((s, x) => s + x.totalAmount, 0),
                    )}
                  </strong>
                </div>
                <div className="bg-slate-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Count: </span>
                  <strong>{filteredPurchases.length}</strong>
                </div>
              </div>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Bill#</th>
                      <th className="text-left">Supplier</th>
                      <th className="text-left">Items</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.slice(0, 50).map((p) => (
                      <tr key={p.id}>
                        <td>{format(parseISO(p.date), "dd MMM yyyy")}</td>
                        <td className="font-mono text-orange-700">
                          {p.billNumber}
                        </td>
                        <td className="font-medium">{p.supplierName}</td>
                        <td className="text-slate-500">
                          {p.items.map((i) => i.productName).join(", ")}
                        </td>
                        <td className="text-right text-red-600 font-semibold">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td>{p.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* P&L Report */}
          {activeTab === "pnl" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle>
                  Profit & Loss Report (Last 12 Months)
                </SectionTitle>
                <ReportActions />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    tick={{ fontSize: 10 }}
                    width={55}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="Sales"
                    stroke="#1e40af"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Purchases"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Gross Profit"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Net Profit"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Month</th>
                      <th className="text-right">Sales</th>
                      <th className="text-right">Purchases</th>
                      <th className="text-right">Expenses</th>
                      <th className="text-right">Gross Profit</th>
                      <th className="text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnlData.map((row) => (
                      <tr key={row.label}>
                        <td className="font-medium">{row.label}</td>
                        <td className="text-right text-blue-700">
                          {formatCurrency(row.Sales)}
                        </td>
                        <td className="text-right text-orange-600">
                          {formatCurrency(row.Purchases)}
                        </td>
                        <td className="text-right text-red-500">
                          {formatCurrency(row.Expenses)}
                        </td>
                        <td
                          className={`text-right font-medium ${row["Gross Profit"] >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {formatCurrency(row["Gross Profit"])}
                        </td>
                        <td
                          className={`text-right font-bold ${row["Net Profit"] >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {formatCurrency(row["Net Profit"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right text-blue-700">
                        {formatCurrency(
                          pnlData.reduce((s, r) => s + r.Sales, 0),
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-orange-600">
                        {formatCurrency(
                          pnlData.reduce((s, r) => s + r.Purchases, 0),
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-red-500">
                        {formatCurrency(
                          pnlData.reduce((s, r) => s + r.Expenses, 0),
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-green-700">
                        {formatCurrency(
                          pnlData.reduce((s, r) => s + r["Gross Profit"], 0),
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-green-700">
                        {formatCurrency(
                          pnlData.reduce((s, r) => s + r["Net Profit"], 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Stock Report */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Stock Report</SectionTitle>
                <ReportActions />
              </div>
              <div className="flex gap-4 text-sm mb-3">
                <div className="bg-blue-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Total Value: </span>
                  <strong className="text-blue-700">
                    {formatCurrency(
                      products.reduce(
                        (s, p) => s + p.quantity * p.costPrice,
                        0,
                      ),
                    )}
                  </strong>
                </div>
                <div className="bg-red-50 px-3 py-2 rounded-md">
                  <span className="text-slate-600">Low Stock: </span>
                  <strong className="text-red-600">
                    {
                      products.filter((p) => p.quantity <= p.minStockLevel)
                        .length
                    }
                  </strong>
                </div>
              </div>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Product</th>
                      <th className="text-left">Category</th>
                      <th className="text-right">Qty</th>
                      <th className="text-left">Unit</th>
                      <th className="text-right">Cost Price</th>
                      <th className="text-right">Stock Value</th>
                      <th className="text-right">Min Level</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isLow = p.quantity <= p.minStockLevel;
                      return (
                        <tr key={p.id}>
                          <td className="font-medium">{p.name}</td>
                          <td>{p.category}</td>
                          <td
                            className={`text-right font-semibold ${isLow ? "text-red-600" : "text-slate-800"}`}
                          >
                            {p.quantity}
                          </td>
                          <td>{p.unit}</td>
                          <td className="text-right">
                            {formatCurrency(p.costPrice)}
                          </td>
                          <td className="text-right text-blue-700 font-semibold">
                            {formatCurrency(p.quantity * p.costPrice)}
                          </td>
                          <td className="text-right">{p.minStockLevel}</td>
                          <td className="text-center">
                            {isLow ? (
                              <span className="flex items-center justify-center gap-0.5 text-red-600">
                                <AlertTriangle size={10} /> Low
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-0.5 text-green-600">
                                <CheckCircle size={10} /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expense Report */}
          {activeTab === "expense" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <SectionTitle>Expense Report</SectionTitle>
                  <DateFilters />
                </div>
                <ReportActions />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      fontSize={11}
                    >
                      {expenseByCategory.map((entry, i) => (
                        <Cell
                          key={`cat-${entry.name}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  <SectionTitle>By Category</SectionTitle>
                  {expenseByCategory.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm text-slate-700">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold text-sm">
                    <span>Total</span>
                    <span className="text-orange-600">
                      {formatCurrency(
                        filteredExpenses.reduce((s, e) => s + e.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Category</th>
                      <th className="text-left">Party</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Payment</th>
                      <th className="text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.slice(0, 50).map((e) => (
                      <tr key={e.id}>
                        <td>{format(parseISO(e.date), "dd MMM yyyy")}</td>
                        <td>
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            {e.category}
                          </span>
                        </td>
                        <td>{e.party}</td>
                        <td className="text-right text-orange-600 font-semibold">
                          {formatCurrency(e.amount)}
                        </td>
                        <td>{e.paymentMethod}</td>
                        <td className="text-slate-500">{e.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          {activeTab === "monthly" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionTitle>Monthly Summary</SectionTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="rep-lbl-1"
                      className="text-xs text-slate-600"
                    >
                      Year:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400"
                    >
                      {[2022, 2023, 2024, 2025].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ReportActions />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlySummaryData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    tick={{ fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Sales" fill="#1e40af" radius={[2, 2, 0, 0]} />
                  <Bar
                    dataKey="Purchases"
                    fill="#ea580c"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="Expenses"
                    fill="#dc2626"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="Net Profit"
                    fill="#16a34a"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-xs erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Month</th>
                      <th className="text-right">Sales</th>
                      <th className="text-right">Purchases</th>
                      <th className="text-right">Expenses</th>
                      <th className="text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaryData.map((row) => (
                      <tr key={row.label}>
                        <td className="font-medium">{row.label}</td>
                        <td className="text-right text-blue-700">
                          {formatCurrency(row.Sales)}
                        </td>
                        <td className="text-right text-orange-600">
                          {formatCurrency(row.Purchases)}
                        </td>
                        <td className="text-right text-red-600">
                          {formatCurrency(row.Expenses)}
                        </td>
                        <td
                          className={`text-right font-bold ${row["Net Profit"] >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {formatCurrency(row["Net Profit"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
