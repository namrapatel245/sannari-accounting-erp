import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { Transaction } from "../../types";
import { formatCurrency, getTodayStr } from "../../utils/helpers";

type FilterType = "All" | "Sale" | "Purchase" | "Expense";

const PAYMENT_METHODS = ["Cash", "Bank", "UPI", "Credit"];

export function Transactions() {
  const {
    transactions,
    settings,
    addExpense,
    updateTransaction,
    deleteTransaction,
  } = useStore();

  // Expense form state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expDate, setExpDate] = useState(getTodayStr());
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expParty, setExpParty] = useState("");
  const [expPayment, setExpPayment] = useState("Cash");
  const [expNotes, setExpNotes] = useState("");
  const [expErrors, setExpErrors] = useState<Record<string, string>>({});

  // Edit transaction state
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Filters
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [filterPayment, setFilterPayment] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  function validateExpense(): boolean {
    const errs: Record<string, string> = {};
    if (!expDate) errs.date = "Date required";
    if (!expCategory) errs.category = "Category required";
    if (expAmount <= 0) errs.amount = "Amount must be > 0";
    setExpErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveExpense() {
    if (!validateExpense()) return;
    addExpense({
      date: expDate,
      category: expCategory,
      amount: expAmount,
      party: expParty,
      paymentMethod: expPayment,
      notes: expNotes,
    });
    toast.success("Expense added");
    setExpDate(getTodayStr());
    setExpCategory("");
    setExpAmount(0);
    setExpParty("");
    setExpPayment("Cash");
    setExpNotes("");
    setExpErrors({});
    setShowExpenseForm(false);
  }

  function openEditTxn(t: Transaction) {
    setEditingTxn(t);
    setEditForm({
      date: t.date,
      partyName: t.partyName,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      notes: t.notes,
    });
    setEditErrors({});
  }

  function validateEdit(): boolean {
    const errs: Record<string, string> = {};
    if (!editForm.date) errs.date = "Date required";
    if (!editForm.amount || editForm.amount <= 0)
      errs.amount = "Amount must be > 0";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveEdit() {
    if (!editingTxn || !validateEdit()) return;
    updateTransaction(editingTxn.id, editForm);
    toast.success("Transaction updated");
    setEditingTxn(null);
    setEditForm({});
  }

  function handleDeleteTxn(t: Transaction) {
    if (
      !confirm(
        `Delete transaction "${t.referenceNumber}"? This cannot be undone.`,
      )
    )
      return;
    deleteTransaction(t.id);
    toast.success("Transaction deleted");
  }

  const filteredTxns = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (
          search &&
          !t.referenceNumber.toLowerCase().includes(search.toLowerCase()) &&
          !t.partyName.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterFrom && t.date < filterFrom) return false;
        if (filterTo && t.date > filterTo) return false;
        if (filterType !== "All" && t.type !== filterType) return false;
        if (filterPayment && t.paymentMethod !== filterPayment) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, filterFrom, filterTo, filterType, filterPayment]);

  const totalPages = Math.ceil(filteredTxns.length / PAGE_SIZE);
  const paginated = filteredTxns.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const summary = useMemo(
    () => ({
      totalSales: transactions
        .filter((t) => t.type === "Sale")
        .reduce((s, t) => s + t.amount, 0),
      totalPurchases: transactions
        .filter((t) => t.type === "Purchase")
        .reduce((s, t) => s + t.amount, 0),
      totalExpenses: transactions
        .filter((t) => t.type === "Expense")
        .reduce((s, t) => s + t.amount, 0),
    }),
    [transactions],
  );

  return (
    <div className="space-y-4">
      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-slate-800">
                Edit Transaction
              </h3>
              <button
                type="button"
                onClick={() => setEditingTxn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {/* Reference (read-only) */}
              <div>
                <p className="block text-xs font-medium text-slate-500 mb-1">
                  Reference No.
                </p>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-[#e2e8f0] rounded-md text-slate-600 font-mono">
                  {editingTxn.referenceNumber}
                </div>
              </div>
              {/* Type (read-only) */}
              <div>
                <p className="block text-xs font-medium text-slate-500 mb-1">
                  Type
                </p>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-[#e2e8f0] rounded-md text-slate-600">
                  {editingTxn.type}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-txn-date"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="edit-txn-date"
                    type="date"
                    value={editForm.date ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  />
                  {editErrors.date && (
                    <p className="text-red-500 text-xs mt-0.5">
                      {editErrors.date}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-txn-amount"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Amount (₹)
                  </label>
                  <input
                    id="edit-txn-amount"
                    type="number"
                    min="0"
                    value={editForm.amount ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        amount: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  />
                  {editErrors.amount && (
                    <p className="text-red-500 text-xs mt-0.5">
                      {editErrors.amount}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="edit-txn-party"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Party Name
                </label>
                <input
                  id="edit-txn-party"
                  value={editForm.partyName ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, partyName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-txn-payment"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment Method
                </label>
                <select
                  id="edit-txn-payment"
                  value={editForm.paymentMethod ?? "Cash"}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-txn-notes"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Notes
                </label>
                <input
                  id="edit-txn-notes"
                  value={editForm.notes ?? ""}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setEditingTxn(null)}
                className="px-4 py-2 text-sm border border-[#e2e8f0] text-slate-600 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Sales</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(summary.totalSales)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Purchases</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(summary.totalPurchases)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Expenses</p>
          <p className="text-lg font-bold text-orange-600">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-slate-800">
            Transaction Ledger
          </h3>
          <button
            type="button"
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="border-b border-[#e2e8f0] bg-orange-50 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-orange-800">
                Add Expense
              </h4>
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label
                  htmlFor="exp-date"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Date
                </label>
                <input
                  id="exp-date"
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                />
                {expErrors.date && (
                  <p className="text-red-500 text-xs">{expErrors.date}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="exp-cat"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Category
                </label>
                <select
                  id="exp-cat"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select</option>
                  {settings.expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {expErrors.category && (
                  <p className="text-red-500 text-xs">{expErrors.category}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="exp-amount"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Amount (₹)
                </label>
                <input
                  id="exp-amount"
                  type="number"
                  min="0"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                />
                {expErrors.amount && (
                  <p className="text-red-500 text-xs">{expErrors.amount}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="exp-party"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Party
                </label>
                <input
                  id="exp-party"
                  value={expParty}
                  onChange={(e) => setExpParty(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                  placeholder="Party name"
                />
              </div>
              <div>
                <label
                  htmlFor="exp-payment"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment
                </label>
                <select
                  id="exp-payment"
                  value={expPayment}
                  onChange={(e) => setExpPayment(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                >
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="exp-notes"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Notes
                </label>
                <input
                  id="exp-notes"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-orange-400"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleSaveExpense}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600"
              >
                <Save size={14} /> Save Expense
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-slate-50">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search reference, party..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400 bg-white"
            />
          </div>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => {
              setFilterFrom(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400 bg-white"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => {
              setFilterTo(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400 bg-white"
          />
          <div className="flex rounded border border-[#e2e8f0] overflow-hidden">
            {(["All", "Sale", "Purchase", "Expense"] as FilterType[]).map(
              (type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterType === type ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
          <select
            value={filterPayment}
            onChange={(e) => {
              setFilterPayment(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">All Payments</option>
            <option>Cash</option>
            <option>Bank</option>
            <option>UPI</option>
            <option>Credit</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Reference
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Party
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Payment
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Notes
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginated.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-t border-slate-100 ${
                      t.type === "Sale"
                        ? "hover:bg-green-50/30"
                        : t.type === "Purchase"
                          ? "hover:bg-red-50/30"
                          : "hover:bg-orange-50/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-600 text-xs">
                      {format(parseISO(t.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
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
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-700">
                      {t.referenceNumber}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {t.partyName}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold ${
                        t.type === "Sale"
                          ? "text-green-700"
                          : t.type === "Purchase"
                            ? "text-red-600"
                            : "text-orange-600"
                      }`}
                    >
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          t.paymentMethod === "Cash"
                            ? "bg-slate-100 text-slate-600"
                            : t.paymentMethod === "Bank"
                              ? "bg-blue-50 text-blue-600"
                              : t.paymentMethod === "UPI"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[150px] truncate">
                      {t.notes}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditTxn(t)}
                          title="Edit transaction"
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTxn(t)}
                          title="Delete transaction"
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0]">
          <span className="text-xs text-slate-500">
            {filteredTxns.length} transactions
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
