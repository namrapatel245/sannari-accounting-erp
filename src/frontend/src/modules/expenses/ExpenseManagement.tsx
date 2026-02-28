import { format, parseISO } from "date-fns";
import { Edit2, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { Expense } from "../../types";
import {
  formatCurrency,
  getTodayStr,
  isInCurrentMonth,
} from "../../utils/helpers";

interface ExpenseForm {
  date: string;
  category: string;
  amount: number;
  party: string;
  paymentMethod: string;
  notes: string;
}

const emptyForm = (): ExpenseForm => ({
  date: getTodayStr(),
  category: "",
  amount: 0,
  party: "",
  paymentMethod: "Cash",
  notes: "",
});

export function ExpenseManagement() {
  const { expenses, settings, addExpense, updateExpense, deleteExpense } =
    useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const monthlyTotal = useMemo(
    () =>
      expenses
        .filter((e) => isInCurrentMonth(e.date))
        .reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  const filteredExpenses = useMemo(() => {
    return [...expenses]
      .filter((e) => {
        if (
          search &&
          !e.party.toLowerCase().includes(search.toLowerCase()) &&
          !e.category.toLowerCase().includes(search.toLowerCase()) &&
          !e.notes.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterCategory && e.category !== filterCategory) return false;
        if (filterFrom && e.date < filterFrom) return false;
        if (filterTo && e.date > filterTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, search, filterCategory, filterFrom, filterTo]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      date: e.date,
      category: e.category,
      amount: e.amount,
      party: e.party,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = "Date required";
    if (!form.category) errs.category = "Category required";
    if (form.amount <= 0) errs.amount = "Amount must be > 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      updateExpense(editing.id, form);
      toast.success("Expense updated");
    } else {
      addExpense(form);
      toast.success("Expense added");
    }
    setShowForm(false);
  }

  function handleDelete(e: Expense) {
    if (!confirm(`Delete this ₹${e.amount} ${e.category} expense?`)) return;
    deleteExpense(e.id);
    toast.success("Expense deleted");
  }

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">This Month</p>
          <p className="text-xl font-bold text-orange-600">
            {formatCurrency(monthlyTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Expenses</p>
          <p className="text-xl font-bold text-slate-800">
            {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Records</p>
          <p className="text-xl font-bold text-slate-800">{expenses.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Categories</p>
          <p className="text-xl font-bold text-slate-800">
            {settings.expenseCategories.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Category Summary */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            By Category
          </h3>
          {categoryTotals.length === 0 ? (
            <p className="text-xs text-slate-400">No data</p>
          ) : (
            <div className="space-y-2">
              {categoryTotals.map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 truncate">{cat}</span>
                  <span className="text-xs font-semibold text-orange-600 ml-2">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] lg:col-span-3">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0] flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
            >
              <option value="">All Categories</option>
              {settings.expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={openAdd}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600"
            >
              <Plus size={14} /> Add Expense
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mx-4 my-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-orange-800">
                  {editing ? "Edit Expense" : "New Expense"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="exp-date"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Date *
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
                  />
                  {errors.date && (
                    <p className="text-red-500 text-xs">{errors.date}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="exp-category"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="exp-category"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="">Select category</option>
                    {settings.expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs">{errors.category}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="exp-amount"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Amount (₹) *
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-xs">{errors.amount}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="exp-party"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Party / Vendor
                  </label>
                  <input
                    id="exp-party"
                    value={form.party}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, party: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="exp-paymode"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Payment Method
                  </label>
                  <select
                    id="exp-paymode"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paymentMethod: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
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
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 border border-[#e2e8f0] text-sm text-slate-600 rounded hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1 px-4 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  <Save size={13} /> Save
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm erp-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Party</th>
                  <th className="text-right">Amount</th>
                  <th className="text-left">Payment</th>
                  <th className="text-left">Notes</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id}>
                      <td className="text-slate-600">
                        {format(parseISO(e.date), "dd MMM yyyy")}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {e.category}
                        </span>
                      </td>
                      <td className="text-slate-700">{e.party || "—"}</td>
                      <td className="text-right font-semibold text-orange-600">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="text-slate-600 text-xs">
                        {e.paymentMethod}
                      </td>
                      <td className="text-slate-400 text-xs max-w-[120px] truncate">
                        {e.notes}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(e)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(e)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-right text-sm font-bold text-slate-700"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-orange-600">
                      {formatCurrency(
                        filteredExpenses.reduce((s, e) => s + e.amount, 0),
                      )}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
