import { format, parseISO } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, Plus, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import { formatCurrency, getTodayStr } from "../../utils/helpers";

interface AdjustmentForm {
  productId: string;
  adjustmentType: "Add" | "Remove";
  quantity: number;
  reason: string;
  date: string;
}

const emptyForm = (): AdjustmentForm => ({
  productId: "",
  adjustmentType: "Add",
  quantity: 1,
  reason: "",
  date: getTodayStr(),
});

export function StockAdjustment() {
  const { products, stockAdjustments, addStockAdjustment } = useStore();
  const [form, setForm] = useState<AdjustmentForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId),
    [products, form.productId],
  );

  const sortedAdjustments = useMemo(
    () =>
      [...stockAdjustments].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [stockAdjustments],
  );

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.productId) errs.productId = "Product required";
    if (form.quantity <= 0) errs.quantity = "Quantity must be > 0";
    if (!form.reason.trim()) errs.reason = "Reason required";
    if (!form.date) errs.date = "Date required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (!selectedProduct) return;
    addStockAdjustment({
      productId: form.productId,
      productName: selectedProduct.name,
      adjustmentType: form.adjustmentType,
      quantity: form.quantity,
      reason: form.reason,
      date: form.date,
    });
    toast.success(
      `Stock ${form.adjustmentType === "Add" ? "increased" : "decreased"} for ${selectedProduct.name}`,
    );
    setForm(emptyForm());
    setShowForm(false);
  }

  const totalAdded = useMemo(
    () =>
      stockAdjustments
        .filter((a) => a.adjustmentType === "Add")
        .reduce((s, a) => s + a.quantity, 0),
    [stockAdjustments],
  );

  const totalRemoved = useMemo(
    () =>
      stockAdjustments
        .filter((a) => a.adjustmentType === "Remove")
        .reduce((s, a) => s + a.quantity, 0),
    [stockAdjustments],
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Adjustments</p>
          <p className="text-xl font-bold text-slate-800">
            {stockAdjustments.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Added (Units)</p>
          <p className="text-xl font-bold text-green-600">{totalAdded}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Removed (Units)</p>
          <p className="text-xl font-bold text-red-600">{totalRemoved}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Net Adjustment</p>
          <p
            className={`text-xl font-bold ${totalAdded - totalRemoved >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {totalAdded - totalRemoved >= 0 ? "+" : ""}
            {totalAdded - totalRemoved}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
          <h2 className="text-base font-semibold text-slate-800">
            Stock Adjustments
          </h2>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
          >
            <Plus size={14} /> New Adjustment
          </button>
        </div>

        {showForm && (
          <div className="p-5 border-b border-[#e2e8f0] bg-green-50/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                New Stock Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label
                  htmlFor="adj-product"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Product *
                </label>
                <select
                  id="adj-product"
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md bg-white focus:outline-none focus:border-green-400"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.productId}
                  </p>
                )}
              </div>

              <div>
                <p className="block text-xs font-medium text-slate-600 mb-1">
                  Adjustment Type *
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, adjustmentType: "Add" }))
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md border transition-colors ${
                      form.adjustmentType === "Add"
                        ? "bg-green-600 text-white border-green-600"
                        : "border-[#e2e8f0] text-slate-600 hover:bg-green-50"
                    }`}
                  >
                    <ArrowUpCircle size={15} /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, adjustmentType: "Remove" }))
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md border transition-colors ${
                      form.adjustmentType === "Remove"
                        ? "bg-red-600 text-white border-red-600"
                        : "border-[#e2e8f0] text-slate-600 hover:bg-red-50"
                    }`}
                  >
                    <ArrowDownCircle size={15} /> Remove
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="adj-qty"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Quantity *
                </label>
                <input
                  id="adj-qty"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md bg-white focus:outline-none focus:border-green-400"
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.quantity}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="adj-date"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Date *
                </label>
                <input
                  id="adj-date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md bg-white focus:outline-none focus:border-green-400"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="adj-reason"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Reason *
                </label>
                <input
                  id="adj-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md bg-white focus:outline-none focus:border-green-400"
                  placeholder="e.g. Stock count correction, damaged goods, production surplus..."
                />
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.reason}</p>
                )}
              </div>
            </div>

            {/* Product preview */}
            {selectedProduct && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedProduct.category} • {selectedProduct.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Current Stock</p>
                    <p className="text-lg font-bold text-slate-800">
                      {selectedProduct.quantity} {selectedProduct.unit}
                    </p>
                    <p className="text-xs text-slate-500">
                      Value:{" "}
                      {formatCurrency(
                        selectedProduct.quantity * selectedProduct.costPrice,
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">After Adjustment</p>
                    <p
                      className={`text-lg font-bold ${form.adjustmentType === "Add" ? "text-green-600" : "text-red-600"}`}
                    >
                      {form.adjustmentType === "Add"
                        ? selectedProduct.quantity + form.quantity
                        : Math.max(
                            0,
                            selectedProduct.quantity - form.quantity,
                          )}{" "}
                      {selectedProduct.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-[#e2e8f0] text-sm text-slate-600 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                <Save size={14} /> Save Adjustment
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm erp-table">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Product</th>
                <th className="text-center">Type</th>
                <th className="text-right">Quantity</th>
                <th className="text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No stock adjustments yet
                  </td>
                </tr>
              ) : (
                sortedAdjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td className="text-slate-600">
                      {format(parseISO(adj.date), "dd MMM yyyy")}
                    </td>
                    <td className="font-medium text-slate-800">
                      {adj.productName}
                    </td>
                    <td className="text-center">
                      {adj.adjustmentType === "Add" ? (
                        <span className="flex items-center justify-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <ArrowUpCircle size={11} /> Add
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          <ArrowDownCircle size={11} /> Remove
                        </span>
                      )}
                    </td>
                    <td
                      className={`text-right font-semibold ${adj.adjustmentType === "Add" ? "text-green-600" : "text-red-600"}`}
                    >
                      {adj.adjustmentType === "Add" ? "+" : "-"}
                      {adj.quantity}
                    </td>
                    <td className="text-slate-500 max-w-[250px] truncate">
                      {adj.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
