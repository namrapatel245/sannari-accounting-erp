import { format, parseISO } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
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
  formatCurrency,
  getLast6Months,
  isInCurrentMonth,
  isInMonth,
} from "../../utils/helpers";

const COLORS = [
  "#166534",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#be185d",
];

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color = "green",
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-green-50 text-green-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1 truncate">
            {value}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 mt-1 text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {change >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {Math.abs(change).toFixed(1)}% from last month
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-slate-700 mb-3">{children}</h2>
  );
}

export function Dashboard() {
  const { sales, purchases, expenses, products, transactions } = useStore();
  const months = useMemo(() => getLast6Months(), []);

  const kpis = useMemo(() => {
    const totalSales = sales.reduce((s, x) => s + x.totalAmount, 0);
    const totalPurchases = purchases.reduce((s, x) => s + x.totalAmount, 0);
    const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;
    const stockValue = products.reduce(
      (s, p) => s + p.quantity * p.costPrice,
      0,
    );

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthlySales = sales
      .filter((s) => isInCurrentMonth(s.date))
      .reduce((acc, x) => acc + x.totalAmount, 0);
    const monthlyPurchases = purchases
      .filter((p) => isInCurrentMonth(p.date))
      .reduce((acc, x) => acc + x.totalAmount, 0);
    const prevMonthlySales = sales
      .filter((s) =>
        isInMonth(s.date, prevMonth.getMonth(), prevMonth.getFullYear()),
      )
      .reduce((acc, x) => acc + x.totalAmount, 0);
    const prevMonthlyPurchases = purchases
      .filter((p) =>
        isInMonth(p.date, prevMonth.getMonth(), prevMonth.getFullYear()),
      )
      .reduce((acc, x) => acc + x.totalAmount, 0);

    const salesChange = prevMonthlySales
      ? ((monthlySales - prevMonthlySales) / prevMonthlySales) * 100
      : 0;
    const purchaseChange = prevMonthlyPurchases
      ? ((monthlyPurchases - prevMonthlyPurchases) / prevMonthlyPurchases) * 100
      : 0;

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      stockValue,
      monthlySales,
      monthlyPurchases,
      salesChange,
      purchaseChange,
    };
  }, [sales, purchases, expenses, products]);

  // Monthly Sales vs Purchase chart data
  const monthlyChartData = useMemo(() => {
    return months.map(({ month, year, label }) => {
      const salesAmt = sales
        .filter((s) => isInMonth(s.date, month, year))
        .reduce((a, x) => a + x.totalAmount, 0);
      const purchaseAmt = purchases
        .filter((p) => isInMonth(p.date, month, year))
        .reduce((a, x) => a + x.totalAmount, 0);
      return { label, Sales: salesAmt, Purchases: purchaseAmt };
    });
  }, [months, sales, purchases]);

  // Profit chart data
  const profitChartData = useMemo(() => {
    return months.map(({ month, year, label }) => {
      const salesAmt = sales
        .filter((s) => isInMonth(s.date, month, year))
        .reduce((a, x) => a + x.totalAmount, 0);
      const purchaseAmt = purchases
        .filter((p) => isInMonth(p.date, month, year))
        .reduce((a, x) => a + x.totalAmount, 0);
      const expenseAmt = expenses
        .filter((e) => isInMonth(e.date, month, year))
        .reduce((a, x) => a + x.amount, 0);
      return {
        label,
        "Gross Profit": salesAmt - purchaseAmt,
        "Net Profit": salesAmt - purchaseAmt - expenseAmt,
      };
    });
  }, [months, sales, purchases, expenses]);

  // Top 5 products by revenue
  const topProducts = useMemo(() => {
    const revenueMap: Record<string, { name: string; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!revenueMap[item.productId])
          revenueMap[item.productId] = { name: item.productName, revenue: 0 };
        revenueMap[item.productId].revenue += item.amount;
      }
    }
    return Object.values(revenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  // Stock distribution by category
  const stockDistribution = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const p of products) {
      if (!catMap[p.category]) catMap[p.category] = 0;
      catMap[p.category] += p.quantity * p.costPrice;
    }
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0);
  }, [products]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const e of expenses) {
      if (!catMap[e.category]) catMap[e.category] = 0;
      catMap[e.category] += e.amount;
    }
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Recent activity
  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [sales],
  );
  const recentPurchases = useMemo(
    () =>
      [...purchases]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [purchases],
  );
  const recentTxns = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions],
  );

  const formatCurrencyShort = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
  };

  return (
    <div className="space-y-5">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales"
          value={formatCurrency(kpis.totalSales)}
          icon={ShoppingCart}
          color="green"
        />
        <KPICard
          title="Total Purchases"
          value={formatCurrency(kpis.totalPurchases)}
          icon={Package}
          color="orange"
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          icon={Wallet}
          color="red"
        />
        <KPICard
          title="Gross Profit"
          value={formatCurrency(kpis.grossProfit)}
          icon={TrendingUp}
          color={kpis.grossProfit >= 0 ? "green" : "red"}
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(kpis.netProfit)}
          icon={kpis.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={kpis.netProfit >= 0 ? "green" : "red"}
        />
        <KPICard
          title="Stock Value"
          value={formatCurrency(kpis.stockValue)}
          icon={Boxes}
          color="purple"
        />
        <KPICard
          title="Monthly Sales"
          value={formatCurrency(kpis.monthlySales)}
          change={kpis.salesChange}
          icon={BarChart3}
          color="green"
        />
        <KPICard
          title="Monthly Purchases"
          value={formatCurrency(kpis.monthlyPurchases)}
          change={kpis.purchaseChange}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales vs Purchase */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Sales vs Purchases (Last 6 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChartData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={formatCurrencyShort}
                tick={{ fontSize: 11 }}
                width={55}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Sales" fill="#166534" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Purchases" fill="#ea580c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Line Chart */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Profit Trend (Last 6 Months)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={profitChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={formatCurrencyShort}
                tick={{ fontSize: 11 }}
                width={55}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Gross Profit"
                stroke="#166534"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Net Profit"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 lg:col-span-1">
          <SectionTitle>Top 5 Products by Revenue</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={formatCurrencyShort}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#166534" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Distribution */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Stock Distribution (by Value)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stockDistribution}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                fontSize={10}
              >
                {stockDistribution.map((entry, i) => (
                  <Cell
                    key={`stock-${entry.name}`}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Expense Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                fontSize={10}
              >
                {expenseBreakdown.map((entry, i) => (
                  <Cell
                    key={`exp-${entry.name}`}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Recent Sales</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pb-2 font-semibold">Bill#</th>
                <th className="text-left pb-2 font-semibold">Customer</th>
                <th className="text-right pb-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-1.5 font-mono text-green-700">
                    {s.billNumber}
                  </td>
                  <td className="py-1.5 text-slate-700 truncate max-w-[80px]">
                    {s.customerName}
                  </td>
                  <td className="py-1.5 text-right text-green-700 font-medium">
                    {formatCurrency(s.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Recent Purchases</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pb-2 font-semibold">Bill#</th>
                <th className="text-left pb-2 font-semibold">Supplier</th>
                <th className="text-right pb-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPurchases.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-1.5 font-mono text-orange-700">
                    {p.billNumber}
                  </td>
                  <td className="py-1.5 text-slate-700 truncate max-w-[80px]">
                    {p.supplierName}
                  </td>
                  <td className="py-1.5 text-right text-red-600 font-medium">
                    {formatCurrency(p.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4">
          <SectionTitle>Recent Transactions</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pb-2 font-semibold">Date</th>
                <th className="text-left pb-2 font-semibold">Party</th>
                <th className="text-left pb-2 font-semibold">Type</th>
                <th className="text-right pb-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-500">
                    {format(parseISO(t.date), "dd MMM")}
                  </td>
                  <td className="py-1.5 text-slate-700 truncate max-w-[70px]">
                    {t.partyName}
                  </td>
                  <td className="py-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.type === "Sale"
                          ? "bg-green-100 text-green-700"
                          : t.type === "Purchase"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-medium text-slate-800">
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
