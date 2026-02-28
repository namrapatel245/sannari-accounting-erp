import {
  AlertTriangle,
  CheckCircle,
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
import type { Product } from "../../types";
import { formatCurrency } from "../../utils/helpers";

interface ProductForm {
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
}

const emptyForm = (): ProductForm => ({
  name: "",
  category: "",
  unit: "kg",
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  minStockLevel: 0,
});

const UNITS = [
  "kg",
  "litre",
  "quintal",
  "bag",
  "piece",
  "tin",
  "bottle",
  "pack",
  "dozen",
];

export function StockManagement() {
  const { products, settings, addProduct, updateProduct, deleteProduct } =
    useStore();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterCategory && p.category !== filterCategory) return false;
      return true;
    });
  }, [products, search, filterCategory]);

  const totalStockValue = useMemo(
    () => products.reduce((s, p) => s + p.quantity * p.costPrice, 0),
    [products],
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.quantity <= p.minStockLevel).length,
    [products],
  );

  function openAdd() {
    setEditingProduct(null);
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name required";
    if (!form.category) errs.category = "Category required";
    if (form.costPrice < 0) errs.costPrice = "Invalid cost price";
    if (form.sellingPrice < 0) errs.sellingPrice = "Invalid selling price";
    if (form.quantity < 0) errs.quantity = "Invalid quantity";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editingProduct) {
      updateProduct(editingProduct.id, form);
      toast.success("Product updated");
    } else {
      addProduct(form);
      toast.success("Product added");
    }
    setShowForm(false);
  }

  function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    deleteProduct(product.id);
    toast.success("Product deleted");
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Total Products</p>
          <p className="text-xl font-bold text-slate-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Stock Value</p>
          <p className="text-xl font-bold text-blue-700">
            {formatCurrency(totalStockValue)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Low Stock Items</p>
          <p className="text-xl font-bold text-red-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-3">
          <p className="text-xs text-slate-500">Categories</p>
          <p className="text-xl font-bold text-slate-800">
            {settings.categories.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0]">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
          >
            <option value="">All Categories</option>
            {settings.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAdd}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Add Product
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm erp-table">
            <thead>
              <tr>
                <th className="text-left">Product Name</th>
                <th className="text-left">Category</th>
                <th className="text-left">Unit</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Cost Price</th>
                <th className="text-right">Sell Price</th>
                <th className="text-right">Stock Value</th>
                <th className="text-center">Min Level</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.quantity <= p.minStockLevel;
                  return (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-800">{p.name}</td>
                      <td>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {p.category}
                        </span>
                      </td>
                      <td className="text-slate-600">{p.unit}</td>
                      <td
                        className={`text-right font-semibold ${isLow ? "text-red-600" : "text-slate-800"}`}
                      >
                        {p.quantity}
                      </td>
                      <td className="text-right text-slate-700">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="text-right text-slate-700">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="text-right font-semibold text-blue-700">
                        {formatCurrency(p.quantity * p.costPrice)}
                      </td>
                      <td className="text-center text-slate-600">
                        {p.minStockLevel}
                      </td>
                      <td className="text-center">
                        {isLow ? (
                          <span className="flex items-center justify-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">
                            <AlertTriangle size={11} /> Low Stock
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">
                            <CheckCircle size={11} /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  htmlFor="prod-name"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Product Name *
                </label>
                <input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="Product name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="prod-category"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Category *
                </label>
                <select
                  id="prod-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                >
                  <option value="">Select category</option>
                  {settings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.category}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="prod-unit"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Unit
                </label>
                <select
                  id="prod-unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="prod-cost"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Cost Price (₹)
                </label>
                <input
                  id="prod-cost"
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      costPrice: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
                {errors.costPrice && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.costPrice}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="prod-sell"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Selling Price (₹)
                </label>
                <input
                  id="prod-sell"
                  type="number"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sellingPrice: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="prod-qty"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Current Stock Qty
                </label>
                <input
                  id="prod-qty"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="prod-min"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Min Stock Level
                </label>
                <input
                  id="prod-min"
                  type="number"
                  min="0"
                  value={form.minStockLevel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minStockLevel: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#e2e8f0] text-sm text-slate-600 rounded-md hover:bg-slate-50"
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Save size={14} /> {editingProduct ? "Update" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
