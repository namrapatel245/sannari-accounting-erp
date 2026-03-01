import {
  AlertTriangle,
  Check,
  Edit2,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import type { Customer, Supplier } from "../../types";
import { downloadJSON } from "../../utils/helpers";

type SettingsTab =
  | "business"
  | "suppliers"
  | "customers"
  | "categories"
  | "invoice"
  | "data";

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

function PartyManager<
  T extends {
    id: string;
    name: string;
    phone: string;
    address: string;
    gst: string;
    openingBalance: number;
  },
>({
  items,
  entityName,
  onAdd,
  onUpdate,
  onDelete,
}: {
  items: T[];
  entityName: string;
  onAdd: (f: PartyForm) => void;
  onUpdate: (id: string, f: Partial<T>) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<PartyForm>(emptyPartyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openAdd() {
    setEditing(null);
    setForm(emptyPartyForm());
    setErrors({});
    setShowForm(true);
  }
  function openEdit(item: T) {
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
      onUpdate(editing.id, form as Partial<T>);
      toast.success(`${entityName} updated`);
    } else {
      onAdd(form);
      toast.success(`${entityName} added`);
    }
    setShowForm(false);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    onDelete(id);
    toast.success(`${entityName} deleted`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {entityName}s ({items.length})
        </h3>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={14} /> Add {entityName}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-800">
              {editing ? `Edit ${entityName}` : `New ${entityName}`}
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
                htmlFor="set-lbl-1"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Name *
              </label>
              <input
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
                htmlFor="set-lbl-2"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="set-lbl-3"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm border border-[#e2e8f0] rounded bg-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="set-lbl-4"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                GST Number
              </label>
              <input
                value={form.gst}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gst: e.target.value }))
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
              <X size={13} className="inline" /> Cancel
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

      {/* Table */}
      <div className="border border-[#e2e8f0] rounded-md overflow-hidden">
        <table className="w-full text-sm erp-table">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Address</th>
              <th className="text-left">GST</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-400">
                  No {entityName.toLowerCase()}s added yet
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-slate-800">{item.name}</td>
                  <td className="text-slate-600">{item.phone}</td>
                  <td className="text-slate-500 max-w-[200px] truncate">
                    {item.address}
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {item.gst}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
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
        </table>
      </div>
    </div>
  );
}

export function Settings() {
  const {
    settings,
    updateSettings,
    suppliers,
    customers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    clearAllData,
    products,
    sales,
    purchases,
    transactions,
    expenses,
    bankAccounts,
  } = useStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("business");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");

  // Business form
  const [bizForm, setBizForm] = useState({ ...settings });
  const [bizSaved, setBizSaved] = useState(false);

  function saveBusiness() {
    updateSettings(bizForm);
    setBizSaved(true);
    toast.success("Business profile saved");
    setTimeout(() => setBizSaved(false), 2000);
  }

  // Categories
  const [newCategory, setNewCategory] = useState("");
  const [newExpCategory, setNewExpCategory] = useState("");

  function addCategory() {
    if (!newCategory.trim()) return;
    if (settings.categories.includes(newCategory.trim())) {
      toast.error("Category exists");
      return;
    }
    updateSettings({
      categories: [...settings.categories, newCategory.trim()],
    });
    setNewCategory("");
    toast.success("Category added");
  }

  function deleteCategory(cat: string) {
    updateSettings({
      categories: settings.categories.filter((c) => c !== cat),
    });
    toast.success("Category removed");
  }

  function addExpCategory() {
    if (!newExpCategory.trim()) return;
    if (settings.expenseCategories.includes(newExpCategory.trim())) {
      toast.error("Category exists");
      return;
    }
    updateSettings({
      expenseCategories: [...settings.expenseCategories, newExpCategory.trim()],
    });
    setNewExpCategory("");
    toast.success("Expense category added");
  }

  function deleteExpCategory(cat: string) {
    updateSettings({
      expenseCategories: settings.expenseCategories.filter((c) => c !== cat),
    });
    toast.success("Category removed");
  }

  function handleExportBackup() {
    const today = new Date().toISOString().slice(0, 10);
    downloadJSON(
      {
        products,
        sales,
        purchases,
        suppliers,
        customers,
        transactions,
        expenses,
        bankAccounts,
        settings,
      },
      `sannari_backup_${today}.json`,
    );
    toast.success("Backup exported successfully");
  }

  function handleClearAll() {
    if (clearConfirmText !== "CLEAR ALL") {
      toast.error('Type "CLEAR ALL" to confirm');
      return;
    }
    clearAllData();
    setConfirmClear(false);
    setClearConfirmText("");
    toast.success("All data cleared");
  }

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "business", label: "Business Profile" },
    { key: "suppliers", label: "Suppliers" },
    { key: "customers", label: "Customers" },
    { key: "categories", label: "Categories" },
    { key: "invoice", label: "Invoice Settings" },
    { key: "data", label: "Data" },
  ];

  return (
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
        {/* Business Profile */}
        {activeTab === "business" && (
          <div className="max-w-2xl">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              Business Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  htmlFor="set-lbl-5"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Business Name
                </label>
                <input
                  value={bizForm.businessName}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, businessName: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="set-lbl-6"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Address
                </label>
                <textarea
                  value={bizForm.address}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, address: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="set-lbl-7"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Phone
                </label>
                <input
                  value={bizForm.phone}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="set-lbl-8"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  GST Number
                </label>
                <input
                  value={bizForm.gst}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, gst: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="set-lbl-9"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Business Type
                </label>
                <input
                  value={bizForm.businessType}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, businessType: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label
                  htmlFor="set-lbl-whatsapp"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  WhatsApp Number
                </label>
                <input
                  id="set-lbl-whatsapp"
                  value={bizForm.whatsappNumber ?? ""}
                  onChange={(e) =>
                    setBizForm((f) => ({
                      ...f,
                      whatsappNumber: e.target.value,
                    }))
                  }
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                />
                <p className="text-xs text-slate-400 mt-0.5">
                  Used for invoice sharing via WhatsApp
                </p>
              </div>
              <div className="col-span-2">
                <p className="block text-xs font-medium text-slate-600 mb-1">
                  Company Logo
                </p>
                <div className="flex items-start gap-4">
                  {bizForm.logoBase64 ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={bizForm.logoBase64}
                        alt="Company Logo Preview"
                        className="h-16 w-auto object-contain border border-[#e2e8f0] rounded-md p-1 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setBizForm((f) => ({ ...f, logoBase64: "" }))
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} /> Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-md bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                        <ImagePlus size={20} className="text-slate-400" />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#e2e8f0] text-slate-700 text-sm rounded-md cursor-pointer transition-colors">
                    <ImagePlus size={14} />
                    {bizForm.logoBase64 ? "Change Logo" : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result;
                          if (typeof result === "string") {
                            setBizForm((f) => ({ ...f, logoBase64: result }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  PNG, JPG or SVG. Will appear on invoices.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={saveBusiness}
              className="mt-4 flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              {bizSaved ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                <>
                  <Save size={14} /> Save Profile
                </>
              )}
            </button>
          </div>
        )}

        {/* Suppliers */}
        {activeTab === "suppliers" && (
          <PartyManager
            items={suppliers}
            entityName="Supplier"
            onAdd={(f) => addSupplier(f)}
            onUpdate={(id, f) => updateSupplier(id, f as Partial<Supplier>)}
            onDelete={(id) => deleteSupplier(id)}
          />
        )}

        {/* Customers */}
        {activeTab === "customers" && (
          <PartyManager
            items={customers}
            entityName="Customer"
            onAdd={(f) => addCustomer(f)}
            onUpdate={(id, f) => updateCustomer(id, f as Partial<Customer>)}
            onDelete={(id) => deleteCustomer(id)}
          />
        )}

        {/* Categories */}
        {activeTab === "categories" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Product Categories
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-800"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat)}
                      className="text-blue-400 hover:text-red-500 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="New category name"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] pt-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Expense Categories
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.expenseCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-800"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => deleteExpCategory(cat)}
                      className="text-orange-400 hover:text-red-500 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExpCategory()}
                  className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="New expense category"
                />
                <button
                  type="button"
                  onClick={addExpCategory}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Management */}
        {activeTab === "data" && (
          <div className="max-w-2xl space-y-6">
            <h3 className="text-base font-semibold text-slate-800">
              Data Management
            </h3>

            {/* Backup */}
            <div className="border border-[#e2e8f0] rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Backup Data
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Download a full backup of all your business data as a JSON file.
                Keep this file safe to restore your data later.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Products", count: products.length },
                  { label: "Sales", count: sales.length },
                  { label: "Purchases", count: purchases.length },
                  { label: "Transactions", count: transactions.length },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-50 rounded-md p-2 text-center"
                  >
                    <div className="text-lg font-bold text-blue-700">
                      {item.count}
                    </div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                <Save size={14} /> Download Backup
              </button>
            </div>

            {/* Clear All Data */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <h4 className="text-sm font-semibold text-red-700">
                  Clear All Data
                </h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Permanently delete all sales, purchases, products, customers,
                suppliers, transactions, and expenses. This action cannot be
                undone. We strongly recommend taking a backup first.
              </p>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  <Trash2 size={14} /> Clear All Data
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-700">
                    Type{" "}
                    <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">
                      CLEAR ALL
                    </span>{" "}
                    to confirm:
                  </p>
                  <input
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    placeholder="Type CLEAR ALL"
                    className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:border-red-500 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClear(false);
                        setClearConfirmText("");
                      }}
                      className="px-4 py-2 text-sm border border-[#e2e8f0] text-slate-600 rounded-md hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={clearConfirmText !== "CLEAR ALL"}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} /> Confirm Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice Settings */}
        {activeTab === "invoice" && (
          <div className="max-w-2xl">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              Invoice Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="set-lbl-10"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Sales Invoice Prefix
                </label>
                <input
                  value={bizForm.invoicePrefix}
                  onChange={(e) =>
                    setBizForm((f) => ({ ...f, invoicePrefix: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="SAL"
                />
                <p className="text-xs text-slate-400 mt-0.5">
                  e.g. SAL → SAL-2024-0001
                </p>
              </div>
              <div>
                <label
                  htmlFor="set-lbl-11"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Purchase Invoice Prefix
                </label>
                <input
                  value={bizForm.purchasePrefix}
                  onChange={(e) =>
                    setBizForm((f) => ({
                      ...f,
                      purchasePrefix: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="PUR"
                />
                <p className="text-xs text-slate-400 mt-0.5">
                  e.g. PUR → PUR-2024-0001
                </p>
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="set-lbl-12"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Terms & Conditions
                </label>
                <textarea
                  value={bizForm.termsConditions}
                  onChange={(e) =>
                    setBizForm((f) => ({
                      ...f,
                      termsConditions: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:border-blue-400"
                  placeholder="Enter terms and conditions..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveBusiness}
              className="mt-4 flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              {bizSaved ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                <>
                  <Save size={14} /> Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
