import { format, parseISO } from "date-fns";
import {
  Edit2,
  Plus,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { Customer, Supplier } from "../../types";
import { formatCurrency } from "../../utils/helpers";

type PartyTab = "customers" | "suppliers";

interface PartyForm {
  name: string;
  phone: string;
  address: string;
  gst: string;
  openingBalance: number;
}

const emptyPartyForm = (): PartyForm => ({
  name: "",
  phone: "",
  address: "",
  gst: "",
  openingBalance: 0,
});

function CustomerManager() {
  const {
    customers,
    sales,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    paymentIns,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<PartyForm>(emptyPartyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);

  // Compute receivables per customer
  const customerReceivables = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sale of sales) {
      if (sale.paymentMethod === "Credit" && sale.paymentStatus !== "Paid") {
        if (!map[sale.customerId]) map[sale.customerId] = 0;
        map[sale.customerId] += sale.totalAmount;
      }
    }
    for (const pin of paymentIns) {
      if (!map[pin.customerId]) map[pin.customerId] = 0;
      map[pin.customerId] -= pin.amount;
    }
    return map;
  }, [sales, paymentIns]);

  const customerSales = useMemo(() => {
    if (!viewingHistory) return [];
    return sales
      .filter((s) => s.customerId === viewingHistory.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, viewingHistory]);

  function openAdd() {
    setEditing(null);
    setForm(emptyPartyForm());
    setErrors({});
    setShowForm(true);
  }

  function openEdit(item: Customer) {
    setEditing(item);
    setForm({
      name: item.name,
      phone: item.phone,
      address: item.address,
      gst: item.gst,
      openingBalance: item.openingBalance,
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      updateCustomer(editing.id, form);
      toast.success("Customer updated");
    } else {
      addCustomer(form);
      toast.success("Customer added");
    }
    setShowForm(false);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteCustomer(id);
    toast.success("Customer deleted");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Customers ({customers.length})
        </h3>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-800">
              {editing ? "Edit Customer" : "New Customer"}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cust-name"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Name *
              </label>
              <input
                id="cust-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="cust-phone"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Phone
              </label>
              <input
                id="cust-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="cust-address"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Address
              </label>
              <input
                id="cust-address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="cust-gst"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                GST Number
              </label>
              <input
                id="cust-gst"
                value={form.gst}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gst: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="cust-ob"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Opening Balance (₹)
              </label>
              <input
                id="cust-ob"
                type="number"
                min="0"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    openingBalance: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
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
              className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Save size={13} /> Save
            </button>
          </div>
        </div>
      )}

      <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
        <table className="w-full text-sm erp-table">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Address</th>
              <th className="text-left">GST</th>
              <th className="text-right">Opening Bal</th>
              <th className="text-right">Receivable</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400">
                  No customers added yet
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const receivable = customerReceivables[c.id] || 0;
                return (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-800">{c.name}</td>
                    <td className="text-slate-600">{c.phone}</td>
                    <td className="text-slate-500 max-w-[150px] truncate">
                      {c.address}
                    </td>
                    <td className="font-mono text-xs text-slate-600">
                      {c.gst}
                    </td>
                    <td className="text-right text-slate-700">
                      {formatCurrency(c.openingBalance)}
                    </td>
                    <td
                      className={`text-right font-semibold ${receivable > 0 ? "text-orange-600" : "text-green-600"}`}
                    >
                      {formatCurrency(receivable > 0 ? receivable : 0)}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingHistory(c)}
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded text-xs"
                          title="View history"
                        >
                          <TrendingUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={13} />
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

      {/* History Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  {viewingHistory.name} — Transaction History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {customerSales.length} sale(s) • Total:{" "}
                  {formatCurrency(
                    customerSales.reduce((s, x) => s + x.totalAmount, 0),
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-xs erp-table">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Bill#</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Payment</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-slate-400"
                      >
                        No sales found
                      </td>
                    </tr>
                  ) : (
                    customerSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{format(parseISO(sale.date), "dd MMM yyyy")}</td>
                        <td className="font-mono text-blue-700">
                          {sale.billNumber}
                        </td>
                        <td className="text-right font-semibold text-green-700">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td>{sale.paymentMethod}</td>
                        <td>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              sale.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-700"
                                : sale.paymentStatus === "Unpaid"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierManager() {
  const {
    suppliers,
    purchases,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    paymentOuts,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<PartyForm>(emptyPartyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewingHistory, setViewingHistory] = useState<Supplier | null>(null);

  const supplierPayables = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of purchases) {
      if (p.paymentMethod === "Credit" && p.paymentStatus !== "Paid") {
        if (!map[p.supplierId]) map[p.supplierId] = 0;
        map[p.supplierId] += p.totalAmount;
      }
    }
    for (const pout of paymentOuts) {
      if (!map[pout.supplierId]) map[pout.supplierId] = 0;
      map[pout.supplierId] -= pout.amount;
    }
    return map;
  }, [purchases, paymentOuts]);

  const supplierPurchases = useMemo(() => {
    if (!viewingHistory) return [];
    return purchases
      .filter((p) => p.supplierId === viewingHistory.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, viewingHistory]);

  function openAdd() {
    setEditing(null);
    setForm(emptyPartyForm());
    setErrors({});
    setShowForm(true);
  }

  function openEdit(item: Supplier) {
    setEditing(item);
    setForm({
      name: item.name,
      phone: item.phone,
      address: item.address,
      gst: item.gst,
      openingBalance: item.openingBalance,
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      updateSupplier(editing.id, form);
      toast.success("Supplier updated");
    } else {
      addSupplier(form);
      toast.success("Supplier added");
    }
    setShowForm(false);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteSupplier(id);
    toast.success("Supplier deleted");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Suppliers ({suppliers.length})
        </h3>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-orange-800">
              {editing ? "Edit Supplier" : "New Supplier"}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="supp-name"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Name *
              </label>
              <input
                id="supp-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="supp-phone"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Phone
              </label>
              <input
                id="supp-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="supp-address"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Address
              </label>
              <input
                id="supp-address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label
                htmlFor="supp-gst"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                GST Number
              </label>
              <input
                id="supp-gst"
                value={form.gst}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gst: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label
                htmlFor="supp-ob"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Opening Balance (₹)
              </label>
              <input
                id="supp-ob"
                type="number"
                min="0"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    openingBalance: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-orange-400"
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
              className="flex items-center gap-1 px-4 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              <Save size={13} /> Save
            </button>
          </div>
        </div>
      )}

      <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
        <table className="w-full text-sm erp-table">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Address</th>
              <th className="text-left">GST</th>
              <th className="text-right">Opening Bal</th>
              <th className="text-right">Payable</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-400">
                  No suppliers added yet
                </td>
              </tr>
            ) : (
              suppliers.map((s) => {
                const payable = supplierPayables[s.id] || 0;
                return (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-800">{s.name}</td>
                    <td className="text-slate-600">{s.phone}</td>
                    <td className="text-slate-500 max-w-[150px] truncate">
                      {s.address}
                    </td>
                    <td className="font-mono text-xs text-slate-600">
                      {s.gst}
                    </td>
                    <td className="text-right text-slate-700">
                      {formatCurrency(s.openingBalance)}
                    </td>
                    <td
                      className={`text-right font-semibold ${payable > 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatCurrency(payable > 0 ? payable : 0)}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingHistory(s)}
                          className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded"
                          title="View history"
                        >
                          <TrendingDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={13} />
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

      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  {viewingHistory.name} — Purchase History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {supplierPurchases.length} purchase(s) • Total:{" "}
                  {formatCurrency(
                    supplierPurchases.reduce((s, x) => s + x.totalAmount, 0),
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-xs erp-table">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Bill#</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Payment</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPurchases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-slate-400"
                      >
                        No purchases found
                      </td>
                    </tr>
                  ) : (
                    supplierPurchases.map((p) => (
                      <tr key={p.id}>
                        <td>{format(parseISO(p.date), "dd MMM yyyy")}</td>
                        <td className="font-mono text-orange-700">
                          {p.billNumber}
                        </td>
                        <td className="text-right font-semibold text-red-600">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td>{p.paymentMethod}</td>
                        <td>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              p.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-700"
                                : p.paymentStatus === "Unpaid"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PartyManagement() {
  const [activeTab, setActiveTab] = useState<PartyTab>("customers");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center border-b border-[#e2e8f0] px-4">
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "customers" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Customers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "suppliers" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Suppliers
          </button>
        </div>
        <div className="p-5">
          {activeTab === "customers" ? (
            <CustomerManager />
          ) : (
            <SupplierManager />
          )}
        </div>
      </div>
    </div>
  );
}
