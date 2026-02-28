import { format, parseISO } from "date-fns";
import {
  Banknote,
  Building2,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { BankAccount } from "../../types";
import { formatCurrency } from "../../utils/helpers";

type CashBankTab = "cash" | "bank";

interface BankForm {
  name: string;
  accountNumber: string;
  ifsc: string;
  balance: number;
}

const emptyBankForm = (): BankForm => ({
  name: "",
  accountNumber: "",
  ifsc: "",
  balance: 0,
});

export function CashBank() {
  const {
    sales,
    purchases,
    expenses,
    transactions,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getCashBalance,
  } = useStore();

  const [activeTab, setActiveTab] = useState<CashBankTab>("cash");
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(
    null,
  );

  const cashBalance = getCashBalance();

  // All cash transactions
  const cashTransactions = useMemo(() => {
    const cashTxns = transactions
      .filter((t) => t.paymentMethod === "Cash")
      .map((t) => ({
        ...t,
        direction: t.type === "Sale" || t.type === "PaymentIn" ? "in" : "out",
      }));
    return [...cashTxns]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50);
  }, [transactions]);

  // Bank total
  const totalBankBalance = useMemo(
    () => bankAccounts.reduce((s, b) => s + b.balance, 0),
    [bankAccounts],
  );

  function openAddBank() {
    setEditingBank(null);
    setBankForm(emptyBankForm());
    setErrors({});
    setShowBankForm(true);
  }

  function openEditBank(b: BankAccount) {
    setEditingBank(b);
    setBankForm({
      name: b.name,
      accountNumber: b.accountNumber,
      ifsc: b.ifsc,
      balance: b.balance,
    });
    setErrors({});
    setShowBankForm(true);
  }

  function validateBank(): boolean {
    const errs: Record<string, string> = {};
    if (!bankForm.name.trim()) errs.name = "Bank name required";
    if (!bankForm.accountNumber.trim())
      errs.accountNumber = "Account number required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveBank() {
    if (!validateBank()) return;
    if (editingBank) {
      updateBankAccount(editingBank.id, bankForm);
      toast.success("Bank account updated");
    } else {
      addBankAccount(bankForm);
      toast.success("Bank account added");
    }
    setShowBankForm(false);
  }

  function handleDeleteBank(id: string, name: string) {
    if (!confirm(`Delete bank account "${name}"?`)) return;
    deleteBankAccount(id);
    toast.success("Bank account deleted");
  }

  // Bank transactions (Bank payment method)
  const bankTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.paymentMethod === "Bank")
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50);
  }, [transactions]);

  const monthlyCashIn = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return sales
      .filter((s) => {
        const d = parseISO(s.date);
        return (
          s.paymentMethod === "Cash" &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  const monthlyCashOut = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const purchaseOut = purchases
      .filter((p) => {
        const d = parseISO(p.date);
        return (
          p.paymentMethod === "Cash" &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const expenseOut = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return (
          e.paymentMethod === "Cash" &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
    return purchaseOut + expenseOut;
  }, [purchases, expenses]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center border-b border-[#e2e8f0] px-4">
          <button
            type="button"
            onClick={() => setActiveTab("cash")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "cash" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Banknote size={16} /> Cash Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "bank" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Building2 size={16} /> Bank Accounts
          </button>
        </div>

        <div className="p-5">
          {activeTab === "cash" && (
            <div className="space-y-4">
              {/* Cash Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-700">
                    Cash Balance
                  </p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {formatCurrency(cashBalance)}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    All-time net cash
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-700">
                    This Month Cash In
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {formatCurrency(monthlyCashIn)}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    From cash sales
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-red-700">
                    This Month Cash Out
                  </p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {formatCurrency(monthlyCashOut)}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Purchases + expenses
                  </p>
                </div>
              </div>

              {/* Cash Transactions */}
              <h3 className="text-sm font-semibold text-slate-700">
                Recent Cash Transactions
              </h3>
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <table className="w-full text-sm erp-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Type</th>
                      <th className="text-left">Reference</th>
                      <th className="text-left">Party</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-slate-400"
                        >
                          No cash transactions
                        </td>
                      </tr>
                    ) : (
                      cashTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="text-slate-600">
                            {format(parseISO(t.date), "dd MMM yyyy")}
                          </td>
                          <td>
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                t.type === "Sale"
                                  ? "bg-green-100 text-green-700"
                                  : t.type === "Purchase"
                                    ? "bg-orange-100 text-orange-700"
                                    : t.type === "Expense"
                                      ? "bg-red-100 text-red-700"
                                      : t.type === "PaymentIn"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-slate-600">
                            {t.referenceNumber}
                          </td>
                          <td className="text-slate-700 max-w-[120px] truncate">
                            {t.partyName}
                          </td>
                          <td
                            className={`text-right font-semibold ${t.direction === "in" ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(t.amount)}
                          </td>
                          <td>
                            <span
                              className={`text-xs font-medium ${t.direction === "in" ? "text-green-600" : "text-red-600"}`}
                            >
                              {t.direction === "in" ? "↑ In" : "↓ Out"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "bank" && (
            <div className="space-y-4">
              {/* Bank Summary */}
              <div className="flex items-center justify-between">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-700 font-medium">
                    Total Bank Balance
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(totalBankBalance)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddBank}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  <Plus size={14} /> Add Bank Account
                </button>
              </div>

              {/* Add/Edit Form */}
              {showBankForm && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-blue-800">
                      {editingBank ? "Edit Bank Account" : "Add Bank Account"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowBankForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label
                        htmlFor="bank-name"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Bank Name *
                      </label>
                      <input
                        id="bank-name"
                        value={bankForm.name}
                        onChange={(e) =>
                          setBankForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
                        placeholder="e.g. State Bank of India - Current"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="bank-acctno"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Account Number *
                      </label>
                      <input
                        id="bank-acctno"
                        value={bankForm.accountNumber}
                        onChange={(e) =>
                          setBankForm((f) => ({
                            ...f,
                            accountNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-500 text-xs">
                          {errors.accountNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="bank-ifsc"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        IFSC Code
                      </label>
                      <input
                        id="bank-ifsc"
                        value={bankForm.ifsc}
                        onChange={(e) =>
                          setBankForm((f) => ({ ...f, ifsc: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bank-balance"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Opening Balance (₹)
                      </label>
                      <input
                        id="bank-balance"
                        type="number"
                        min="0"
                        value={bankForm.balance}
                        onChange={(e) =>
                          setBankForm((f) => ({
                            ...f,
                            balance: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowBankForm(false)}
                      className="px-3 py-1.5 border border-[#e2e8f0] text-sm text-slate-600 rounded hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBank}
                      className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Save size={13} /> Save
                    </button>
                  </div>
                </div>
              )}

              {/* Bank Accounts List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bankAccounts.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400 border border-[#e2e8f0] rounded-lg">
                    No bank accounts added yet
                  </div>
                ) : (
                  bankAccounts.map((b) => (
                    <div
                      key={b.id}
                      className="border border-[#e2e8f0] rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">
                              {b.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono">
                              {b.accountNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setViewingAccount(
                                viewingAccount?.id === b.id ? null : b,
                              )
                            }
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs"
                            title="View transactions"
                          >
                            Txns
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditBank(b)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBank(b.id, b.name)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">
                            IFSC: {b.ifsc || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Balance</p>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(b.balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bank Transactions */}
              {viewingAccount && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Bank Transactions (Recent)
                  </h3>
                  <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                    <table className="w-full text-sm erp-table">
                      <thead>
                        <tr>
                          <th className="text-left">Date</th>
                          <th className="text-left">Type</th>
                          <th className="text-left">Reference</th>
                          <th className="text-left">Party</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankTransactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-6 text-slate-400"
                            >
                              No bank transactions
                            </td>
                          </tr>
                        ) : (
                          bankTransactions.map((t) => (
                            <tr key={t.id}>
                              <td className="text-slate-600">
                                {format(parseISO(t.date), "dd MMM yyyy")}
                              </td>
                              <td>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    t.type === "Sale"
                                      ? "bg-green-100 text-green-700"
                                      : t.type === "Purchase"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {t.type}
                                </span>
                              </td>
                              <td className="font-mono text-xs text-slate-600">
                                {t.referenceNumber}
                              </td>
                              <td className="text-slate-700">{t.partyName}</td>
                              <td
                                className={`text-right font-semibold ${t.type === "Sale" ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatCurrency(t.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
