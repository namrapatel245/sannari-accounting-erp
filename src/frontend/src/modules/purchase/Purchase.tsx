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
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { PurchaseItem, Purchase as PurchaseType } from "../../types";
import {
  formatCurrency,
  formatDate,
  generateBillNumber,
  generateId,
  getTodayStr,
} from "../../utils/helpers";

interface FormItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  hsnCode: string;
  gstAmount: number;
  amount: number;
}

const GST_RATES = [0, 5, 12, 18, 28];

const emptyItem = (): FormItem => ({
  id: generateId(),
  productId: "",
  productName: "",
  quantity: 1,
  rate: 0,
  gstPercent: 5,
  hsnCode: "",
  gstAmount: 0,
  amount: 0,
});

function calcItem(item: FormItem): FormItem {
  const base = item.quantity * item.rate;
  const gstAmount = (base * item.gstPercent) / 100;
  return { ...item, gstAmount, amount: base + gstAmount };
}

export function Purchase() {
  const {
    purchases,
    products,
    suppliers,
    addPurchase,
    updatePurchase,
    deletePurchase,
    settings,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"form" | "list">("list");
  const [editingPurchase, setEditingPurchase] = useState<PurchaseType | null>(
    null,
  );

  // Form state
  const [billNumber, setBillNumber] = useState("");
  const [date, setDate] = useState(getTodayStr());
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [narration, setNarration] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);
  const [paymentMethod, setPaymentMethod] =
    useState<PurchaseType["paymentMethod"]>("Cash");
  const [paymentStatus, setPaymentStatus] =
    useState<PurchaseType["paymentStatus"]>("Paid");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // List filters
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const resetForm = useCallback(() => {
    const nextBill = generateBillNumber(
      settings.purchasePrefix,
      purchases.map((p) => p.billNumber),
    );
    setBillNumber(nextBill);
    setDate(getTodayStr());
    setSupplierId("");
    setSupplierName("");
    setNarration("");
    setItems([emptyItem()]);
    setPaymentMethod("Cash");
    setPaymentStatus("Paid");
    setErrors({});
    setEditingPurchase(null);
  }, [purchases, settings.purchasePrefix]);

  const openNewForm = useCallback(() => {
    resetForm();
    setActiveTab("form");
  }, [resetForm]);

  const openEditForm = useCallback((purchase: PurchaseType) => {
    setEditingPurchase(purchase);
    setBillNumber(purchase.billNumber);
    setDate(purchase.date);
    setSupplierId(purchase.supplierId);
    setSupplierName(purchase.supplierName);
    setNarration(purchase.narration);
    setItems(
      purchase.items.map((i) => ({
        id: generateId(),
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        rate: i.rate,
        gstPercent: i.gstPercent ?? 5,
        hsnCode: i.hsnCode ?? "",
        gstAmount: i.gstAmount ?? 0,
        amount: i.amount,
      })),
    );
    setPaymentMethod(purchase.paymentMethod);
    setPaymentStatus(purchase.paymentStatus ?? "Paid");
    setErrors({});
    setActiveTab("form");
  }, []);

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    setSupplierName(sup?.name || id);
  }

  function handleItemProduct(idx: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? calcItem({
              ...item,
              productId,
              productName: product?.name || "",
              rate: product?.costPrice || 0,
            })
          : item,
      ),
    );
  }

  function handleItemField(
    idx: number,
    field: keyof FormItem,
    value: number | string,
  ) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return calcItem({ ...item, [field]: value });
      }),
    );
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const gstTotal = items.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);
    return { subtotal, gstTotal, totalAmount };
  }, [items]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!billNumber.trim()) errs.billNumber = "Bill number required";
    if (!date) errs.date = "Date required";
    if (!supplierName.trim()) errs.supplierName = "Supplier required";
    if (items.length === 0) errs.items = "At least one item required";
    for (const item of items) {
      if (!item.productId) {
        errs.items = "Select product for all items";
        break;
      }
      if (item.quantity <= 0) {
        errs.items = "Quantity must be > 0";
        break;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const purchaseItems: PurchaseItem[] = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.amount,
      gstPercent: i.gstPercent,
      hsnCode: i.hsnCode,
      gstAmount: i.gstAmount,
    }));

    const purchaseData = {
      billNumber,
      date,
      supplierId,
      supplierName,
      narration,
      items: purchaseItems,
      totalAmount: totals.totalAmount,
      subtotal: totals.subtotal,
      gstTotal: totals.gstTotal,
      paymentMethod,
      paymentStatus,
    };

    if (editingPurchase) {
      updatePurchase(editingPurchase.id, purchaseData, editingPurchase.items);
      toast.success("Purchase updated");
    } else {
      addPurchase(purchaseData);
      toast.success("Purchase saved");
    }
    resetForm();
    setActiveTab("list");
  }

  function handleDelete(purchase: PurchaseType) {
    if (
      !confirm(
        `Delete ${purchase.billNumber}? This will reverse stock changes.`,
      )
    )
      return;
    deletePurchase(purchase.id);
    toast.success("Purchase deleted");
  }

  const filteredPurchases = useMemo(() => {
    return [...purchases]
      .filter((p) => {
        if (
          search &&
          !p.billNumber.toLowerCase().includes(search.toLowerCase()) &&
          !p.supplierName.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterFrom && p.date < filterFrom) return false;
        if (filterTo && p.date > filterTo) return false;
        if (filterSupplier && p.supplierId !== filterSupplier) return false;
        if (filterPayment && p.paymentMethod !== filterPayment) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchases, search, filterFrom, filterTo, filterSupplier, filterPayment]);

  const totalPages = Math.ceil(filteredPurchases.length / PAGE_SIZE);
  const paginated = filteredPurchases.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const statusBadge = (status: string) => {
    const cls =
      status === "Paid"
        ? "bg-green-100 text-green-700"
        : status === "Unpaid"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center border-b border-[#e2e8f0] px-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              resetForm();
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "list" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Purchase List
          </button>
          <button
            type="button"
            onClick={openNewForm}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === "form" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {editingPurchase ? "Edit Purchase" : "New Purchase"}
          </button>
          <button
            type="button"
            onClick={openNewForm}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors my-2"
          >
            <Plus size={15} /> New Purchase
          </button>
        </div>

        {activeTab === "form" ? (
          <div className="p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              {editingPurchase ? "Edit Purchase" : "New Purchase Entry"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label
                  htmlFor="pur-billno"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Bill Number *
                </label>
                <input
                  id="pur-billno"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                />
                {errors.billNumber && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.billNumber}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="pur-date"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Date *
                </label>
                <input
                  id="pur-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                />
              </div>
              <div>
                <label
                  htmlFor="pur-supplier"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Supplier *
                </label>
                <select
                  id="pur-supplier"
                  value={supplierId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__manual__") {
                      setSupplierId("");
                      setSupplierName("");
                    } else handleSupplierChange(val);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="__manual__">-- Enter manually --</option>
                </select>
                {!supplierId && (
                  <input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none"
                    placeholder="Supplier name"
                  />
                )}
                {errors.supplierName && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.supplierName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="pur-paymode"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment Method
                </label>
                <select
                  id="pur-paymode"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(
                      e.target.value as PurchaseType["paymentMethod"],
                    );
                    if (e.target.value === "Credit") setPaymentStatus("Unpaid");
                    else setPaymentStatus("Paid");
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                >
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                  <option>Credit</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="pur-paystatus"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment Status
                </label>
                <select
                  id="pur-paystatus"
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(
                      e.target.value as PurchaseType["paymentStatus"],
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none"
                >
                  <option>Paid</option>
                  <option>Unpaid</option>
                  <option>Partial</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-3">
                <label
                  htmlFor="pur-narration"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Narration
                </label>
                <input
                  id="pur-narration"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none"
                  placeholder="Notes"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700">Items</h4>
                <button
                  type="button"
                  onClick={() => setItems((p) => [...p, emptyItem()])}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>
              {errors.items && (
                <p className="text-red-500 text-xs mb-1">{errors.items}</p>
              )}
              <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-slate-600 w-6">
                          #
                        </th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-slate-600 min-w-[140px]">
                          Product
                        </th>
                        <th className="text-left px-2 py-2 text-xs font-semibold text-slate-600 w-20">
                          HSN
                        </th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-16">
                          Qty
                        </th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-24">
                          Rate (₹)
                        </th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-18">
                          GST%
                        </th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-24">
                          GST Amt
                        </th>
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-28">
                          Amount
                        </th>
                        <th className="px-2 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} className="border-t border-[#e2e8f0]">
                          <td className="px-2 py-1.5 text-xs text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                handleItemProduct(idx, e.target.value)
                              }
                              className="w-full px-1.5 py-1 text-xs border border-[#e2e8f0] rounded focus:outline-none focus:border-green-400"
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.unit})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={item.hsnCode}
                              onChange={(e) =>
                                handleItemField(idx, "hsnCode", e.target.value)
                              }
                              className="w-full px-1.5 py-1 text-xs border border-[#e2e8f0] rounded focus:outline-none focus:border-green-400"
                              placeholder="HSN"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemField(
                                  idx,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full px-1.5 py-1 text-xs border border-[#e2e8f0] rounded text-right focus:outline-none focus:border-green-400"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemField(
                                  idx,
                                  "rate",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full px-1.5 py-1 text-xs border border-[#e2e8f0] rounded text-right focus:outline-none focus:border-green-400"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={item.gstPercent}
                              onChange={(e) =>
                                handleItemField(
                                  idx,
                                  "gstPercent",
                                  Number(e.target.value),
                                )
                              }
                              className="w-full px-1.5 py-1 text-xs border border-[#e2e8f0] rounded focus:outline-none focus:border-green-400"
                            >
                              {GST_RATES.map((r) => (
                                <option key={r} value={r}>
                                  {r}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-right text-xs text-slate-500">
                            {formatCurrency(item.gstAmount)}
                          </td>
                          <td className="px-2 py-1.5 text-right font-medium text-xs">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 py-1.5">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setItems((p) => p.filter((_, i) => i !== idx))
                                }
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-2 text-right text-xs text-slate-600"
                        >
                          Subtotal:
                        </td>
                        <td
                          colSpan={2}
                          className="px-2 py-2 text-right text-xs font-medium"
                        >
                          {formatCurrency(totals.subtotal)}
                        </td>
                        <td />
                      </tr>
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-2 text-right text-xs text-slate-600"
                        >
                          GST Total:
                        </td>
                        <td
                          colSpan={2}
                          className="px-2 py-2 text-right text-xs font-medium"
                        >
                          {formatCurrency(totals.gstTotal)}
                        </td>
                        <td />
                      </tr>
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-2 text-right text-sm font-bold text-slate-700"
                        >
                          Total Amount:
                        </td>
                        <td
                          colSpan={2}
                          className="px-2 py-2 text-right text-base font-bold text-green-700"
                        >
                          {formatCurrency(totals.totalAmount)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab("list");
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#e2e8f0] text-sm text-slate-600 rounded-md hover:bg-slate-50"
              >
                <X size={15} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                <Save size={15} />{" "}
                {editingPurchase ? "Update Purchase" : "Save Purchase"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[160px]">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Search bill number, supplier..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none"
                />
              </div>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              />
              <select
                value={filterSupplier}
                onChange={(e) => {
                  setFilterSupplier(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={filterPayment}
                onChange={(e) => {
                  setFilterPayment(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="">All Payments</option>
                <option>Cash</option>
                <option>Bank</option>
                <option>UPI</option>
                <option>Credit</option>
              </select>
            </div>

            <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
              <table className="w-full text-sm erp-table">
                <thead>
                  <tr>
                    <th className="text-left">Bill #</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Supplier</th>
                    <th className="text-left">Items</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Payment</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-8 text-slate-400"
                      >
                        No purchases found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-orange-700 text-xs">
                          {p.billNumber}
                        </td>
                        <td className="text-slate-600">{formatDate(p.date)}</td>
                        <td className="font-medium text-slate-800">
                          {p.supplierName}
                        </td>
                        <td className="text-slate-500 text-xs">
                          {p.items.length} item{p.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="text-right font-semibold text-red-600">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${p.paymentMethod === "Cash" ? "bg-green-100 text-green-700" : p.paymentMethod === "Bank" ? "bg-green-100 text-green-700" : p.paymentMethod === "UPI" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}
                          >
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td>{statusBadge(p.paymentStatus ?? "Paid")}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(p)}
                              className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">
                  {filteredPurchases.length} records
                </span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
