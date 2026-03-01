import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PrintInvoice } from "../../components/PrintInvoice";
import { useStore } from "../../store";
import type { Sale, SaleItem } from "../../types";
import {
  formatCurrency,
  formatDate,
  generateBillNumber,
  generateId,
  getTodayStr,
} from "../../utils/helpers";

type Tab = "form" | "list";

interface FormItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  discount: number;
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
  discount: 0,
  gstPercent: 5,
  hsnCode: "",
  gstAmount: 0,
  amount: 0,
});

function calcItem(item: FormItem): FormItem {
  const base = item.quantity * item.rate - item.discount;
  const gstAmount = (base * item.gstPercent) / 100;
  return { ...item, gstAmount, amount: base + gstAmount };
}

export function Sales() {
  const {
    sales,
    products,
    customers,
    bankAccounts,
    addSale,
    updateSale,
    deleteSale,
    settings,
  } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);

  // Form state
  const [billNumber, setBillNumber] = useState("");
  const [date, setDate] = useState(getTodayStr());
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [narration, setNarration] = useState("");
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);
  const [paymentMethod, setPaymentMethod] =
    useState<Sale["paymentMethod"]>("Cash");
  const [paymentStatus, setPaymentStatus] =
    useState<Sale["paymentStatus"]>("Paid");
  const [bankAccountId, setBankAccountId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // List filters
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const resetForm = useCallback(() => {
    const nextBill = generateBillNumber(
      settings.invoicePrefix,
      sales.map((s) => s.billNumber),
    );
    setBillNumber(nextBill);
    setDate(getTodayStr());
    setCustomerId("");
    setCustomerName("");
    setCustomerMobile("");
    setNarration("");
    setItems([emptyItem()]);
    setPaymentMethod("Cash");
    setPaymentStatus("Paid");
    setBankAccountId("");
    setErrors({});
    setEditingSale(null);
  }, [sales, settings.invoicePrefix]);

  const openNewForm = useCallback(() => {
    resetForm();
    setActiveTab("form");
  }, [resetForm]);

  const openEditForm = useCallback((sale: Sale) => {
    setEditingSale(sale);
    setBillNumber(sale.billNumber);
    setDate(sale.date);
    setCustomerId(sale.customerId);
    setCustomerName(sale.customerName);
    setCustomerMobile(sale.customerMobile ?? "");
    setNarration(sale.narration);
    setItems(
      sale.items.map((i) => ({
        id: generateId(),
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount ?? 0,
        gstPercent: i.gstPercent ?? 5,
        hsnCode: i.hsnCode ?? "",
        gstAmount: i.gstAmount ?? 0,
        amount: i.amount,
      })),
    );
    setPaymentMethod(sale.paymentMethod);
    setPaymentStatus(sale.paymentStatus ?? "Paid");
    setBankAccountId(sale.bankAccountId ?? "");
    setErrors({});
    setActiveTab("form");
  }, []);

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    setCustomerName(cust?.name || id);
    if (cust?.phone) setCustomerMobile(cust.phone);
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
              rate: product?.sellingPrice || 0,
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
        const updated = { ...item, [field]: value };
        return calcItem(updated);
      }),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const discountTotal = items.reduce((s, i) => s + (i.discount || 0), 0);
    const gstTotal = items.reduce((s, i) => s + i.gstAmount, 0);
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);
    return { subtotal, discountTotal, gstTotal, totalAmount };
  }, [items]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!billNumber.trim()) errs.billNumber = "Bill number required";
    if (!date) errs.date = "Date required";
    if (!customerName.trim()) errs.customerName = "Customer required";
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

    const saleItems: SaleItem[] = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.amount,
      discount: i.discount,
      gstPercent: i.gstPercent,
      hsnCode: i.hsnCode,
      gstAmount: i.gstAmount,
    }));

    const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
    const saleData = {
      billNumber,
      date,
      customerId,
      customerName,
      customerMobile: customerMobile.trim() || undefined,
      narration,
      items: saleItems,
      totalAmount: totals.totalAmount,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      gstTotal: totals.gstTotal,
      paymentMethod,
      paymentStatus,
      bankAccountId:
        paymentMethod === "Bank" ? bankAccountId || undefined : undefined,
      bankAccountName:
        paymentMethod === "Bank" ? selectedBank?.name || undefined : undefined,
    };

    if (editingSale) {
      updateSale(editingSale.id, saleData, editingSale.items);
      toast.success("Sale updated successfully");
    } else {
      addSale(saleData);
      toast.success("Sale saved successfully");
    }
    resetForm();
    setActiveTab("list");
  }

  function handleDelete(sale: Sale) {
    if (!confirm(`Delete ${sale.billNumber}? This will reverse stock changes.`))
      return;
    deleteSale(sale.id);
    toast.success("Sale deleted");
  }

  // Filtered list
  const filteredSales = useMemo(() => {
    return [...sales]
      .filter((s) => {
        if (
          search &&
          !s.billNumber.toLowerCase().includes(search.toLowerCase()) &&
          !s.customerName.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterFrom && s.date < filterFrom) return false;
        if (filterTo && s.date > filterTo) return false;
        if (filterCustomer && s.customerId !== filterCustomer) return false;
        if (filterPayment && s.paymentMethod !== filterPayment) return false;
        if (filterStatus && s.paymentStatus !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    sales,
    search,
    filterFrom,
    filterTo,
    filterCustomer,
    filterPayment,
    filterStatus,
  ]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE);
  const paginated = filteredSales.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const paymentStatusBadge = (status: string) => {
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

  const paymentMethodBadge = (method: string) => {
    const cls =
      method === "Cash"
        ? "bg-green-100 text-green-700"
        : method === "Bank"
          ? "bg-green-100 text-green-700"
          : method === "UPI"
            ? "bg-purple-100 text-purple-700"
            : "bg-orange-100 text-orange-700";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {printingSale && (
        <PrintInvoice
          sale={printingSale}
          settings={settings}
          onClose={() => setPrintingSale(null)}
        />
      )}

      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center border-b border-[#e2e8f0] px-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              resetForm();
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === "list" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Sales List
          </button>
          <button
            type="button"
            onClick={openNewForm}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === "form" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {editingSale ? "Edit Sale" : "New Sale"}
          </button>
          <button
            type="button"
            onClick={openNewForm}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors my-2"
          >
            <Plus size={15} /> New Sale
          </button>
        </div>

        {activeTab === "form" ? (
          <div className="p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              {editingSale ? "Edit Sale" : "New Sale Entry"}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label
                  htmlFor="sale-billno"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Bill Number *
                </label>
                <input
                  id="sale-billno"
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
                  htmlFor="sale-date"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Date *
                </label>
                <input
                  id="sale-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                />
              </div>
              <div>
                <label
                  htmlFor="sale-customer"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Customer *
                </label>
                <select
                  id="sale-customer"
                  value={customerId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__manual__") {
                      setCustomerId("");
                      setCustomerName("");
                    } else handleCustomerChange(val);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__manual__">-- Enter manually --</option>
                </select>
                {!customerId && (
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    placeholder="Customer name"
                  />
                )}
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.customerName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="sale-mobile"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Mobile No{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="sale-mobile"
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                  placeholder="e.g. 9876543210"
                  maxLength={15}
                />
              </div>
              <div>
                <label
                  htmlFor="sale-paymode"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment Method
                </label>
                <select
                  id="sale-paymode"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as Sale["paymentMethod"]);
                    if (e.target.value === "Credit") setPaymentStatus("Unpaid");
                    else setPaymentStatus("Paid");
                    if (e.target.value !== "Bank") setBankAccountId("");
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                >
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                  <option>Credit</option>
                </select>
              </div>
              {paymentMethod === "Bank" && (
                <div>
                  <label
                    htmlFor="sale-bank-account"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Bank Account
                  </label>
                  {bankAccounts.length === 0 ? (
                    <div className="w-full px-3 py-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                      No bank accounts added. Go to Cash &amp; Bank to add one.
                    </div>
                  ) : (
                    <select
                      id="sale-bank-account"
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                          {b.accountNumber ? ` (${b.accountNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div>
                <label
                  htmlFor="sale-paystatus"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Payment Status
                </label>
                <select
                  id="sale-paystatus"
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as Sale["paymentStatus"])
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                >
                  <option>Paid</option>
                  <option>Unpaid</option>
                  <option>Partial</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-3">
                <label
                  htmlFor="sale-narration"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Narration
                </label>
                <input
                  id="sale-narration"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                  placeholder="Notes or description"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700">Items</h4>
                <button
                  type="button"
                  onClick={addItem}
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
                  <table className="w-full text-sm min-w-[800px]">
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
                        <th className="text-right px-2 py-2 text-xs font-semibold text-slate-600 w-20">
                          Disc (₹)
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
                          <td className="px-2 py-1.5 text-slate-500 text-xs">
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
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) =>
                                handleItemField(
                                  idx,
                                  "discount",
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
                          <td className="px-2 py-1.5 text-right font-medium text-slate-800 text-xs">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 py-1.5">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
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
                          colSpan={7}
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
                      {totals.discountTotal > 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-2 py-2 text-right text-xs text-slate-600"
                          >
                            Discount:
                          </td>
                          <td
                            colSpan={2}
                            className="px-2 py-2 text-right text-xs font-medium text-red-500"
                          >
                            -{formatCurrency(totals.discountTotal)}
                          </td>
                          <td />
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={7}
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
                          colSpan={7}
                          className="px-2 py-2 text-right text-sm font-bold text-slate-700"
                        >
                          Grand Total:
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
                <Save size={15} /> {editingSale ? "Update Sale" : "Save Sale"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[160px]">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Search bill number, customer..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
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
                value={filterCustomer}
                onChange={(e) => {
                  setFilterCustomer(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-green-400"
              >
                <option value="">All Status</option>
                <option>Paid</option>
                <option>Unpaid</option>
                <option>Partial</option>
              </select>
            </div>

            {/* Summary */}
            <div className="flex gap-4 mb-3 text-xs text-slate-500">
              <span>{filteredSales.length} records</span>
              <span className="text-green-600 font-semibold">
                Total:{" "}
                {formatCurrency(
                  filteredSales.reduce((s, x) => s + x.totalAmount, 0),
                )}
              </span>
            </div>

            {/* Table */}
            <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
              <table className="w-full text-sm erp-table">
                <thead>
                  <tr>
                    <th className="text-left">Bill #</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Customer</th>
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
                        No sales found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((sale) => (
                      <tr key={sale.id}>
                        <td className="font-mono text-green-700 text-xs">
                          {sale.billNumber}
                        </td>
                        <td className="text-slate-600">
                          {formatDate(sale.date)}
                        </td>
                        <td className="font-medium text-slate-800">
                          {sale.customerName}
                        </td>
                        <td className="text-slate-500 text-xs">
                          {sale.items.length} item
                          {sale.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="text-right font-semibold text-green-700">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            {paymentMethodBadge(sale.paymentMethod)}
                            {sale.paymentMethod === "Bank" &&
                              sale.bankAccountName && (
                                <span className="text-xs text-slate-500 leading-none">
                                  {sale.bankAccountName}
                                </span>
                              )}
                          </div>
                        </td>
                        <td>
                          {paymentStatusBadge(sale.paymentStatus ?? "Paid")}
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintingSale(sale)}
                              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Print invoice"
                            >
                              <Printer size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(sale)}
                              className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sale)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-500">
                  {filteredSales.length} records
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
