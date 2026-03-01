import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  FileJson,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import { downloadJSON } from "../../utils/helpers";

interface ImportPreview {
  products?: number;
  sales?: number;
  purchases?: number;
  suppliers?: number;
  customers?: number;
  transactions?: number;
  expenses?: number;
  bankAccounts?: number;
  settings?: boolean;
}

export function ImportExport() {
  const store = useStore();
  const {
    products,
    sales,
    purchases,
    suppliers,
    customers,
    transactions,
    expenses,
    bankAccounts,
    settings,
    importData,
  } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [importJsonData, setImportJsonData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [importError, setImportError] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const exportAll = () => {
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
    toast.success("Full backup exported");
  };

  const exportDataset = (key: string, data: unknown) => {
    downloadJSON({ [key]: data }, `sannari_${key}_${today}.json`);
    toast.success(`${key} exported`);
  };

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Record<
          string,
          unknown
        >;
        const preview: ImportPreview = {};
        if (Array.isArray(parsed.products))
          preview.products = (parsed.products as unknown[]).length;
        if (Array.isArray(parsed.sales))
          preview.sales = (parsed.sales as unknown[]).length;
        if (Array.isArray(parsed.purchases))
          preview.purchases = (parsed.purchases as unknown[]).length;
        if (Array.isArray(parsed.suppliers))
          preview.suppliers = (parsed.suppliers as unknown[]).length;
        if (Array.isArray(parsed.customers))
          preview.customers = (parsed.customers as unknown[]).length;
        if (Array.isArray(parsed.transactions))
          preview.transactions = (parsed.transactions as unknown[]).length;
        if (Array.isArray(parsed.expenses))
          preview.expenses = (parsed.expenses as unknown[]).length;
        if (Array.isArray(parsed.bankAccounts))
          preview.bankAccounts = (parsed.bankAccounts as unknown[]).length;
        if (parsed.settings && typeof parsed.settings === "object")
          preview.settings = true;

        if (Object.keys(preview).length === 0) {
          setImportError(
            "No valid data found in file. Expected arrays for products, sales, purchases, etc.",
          );
          setImportPreview(null);
          return;
        }

        setImportPreview(preview);
        setImportJsonData(parsed);
      } catch {
        setImportError(
          "Invalid JSON file. Please select a valid SANNARI backup file.",
        );
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!importJsonData) return;
    importData(importJsonData as Parameters<typeof importData>[0], importMode);
    setImportSuccess(true);
    setImportFile(null);
    setImportPreview(null);
    setImportJsonData(null);
    if (fileRef.current) fileRef.current.value = "";
    toast.success(
      `Data ${importMode === "replace" ? "replaced" : "merged"} successfully`,
    );
  }

  const exportItems = [
    {
      label: "Full Backup (All Data)",
      description: "Complete backup including all modules",
      icon: "🗄️",
      action: exportAll,
      count: `${products.length}P + ${sales.length}S + ${purchases.length}PU`,
    },
    {
      label: "Sales",
      description: `${sales.length} sale records`,
      icon: "🛒",
      action: () => exportDataset("sales", sales),
      count: `${sales.length} records`,
    },
    {
      label: "Purchases",
      description: `${purchases.length} purchase records`,
      icon: "📦",
      action: () => exportDataset("purchases", purchases),
      count: `${purchases.length} records`,
    },
    {
      label: "Products / Stock",
      description: `${products.length} products`,
      icon: "📊",
      action: () => exportDataset("products", products),
      count: `${products.length} products`,
    },
    {
      label: "Suppliers",
      description: `${suppliers.length} suppliers`,
      icon: "🏭",
      action: () => exportDataset("suppliers", suppliers),
      count: `${suppliers.length} entries`,
    },
    {
      label: "Customers",
      description: `${customers.length} customers`,
      icon: "👥",
      action: () => exportDataset("customers", customers),
      count: `${customers.length} entries`,
    },
    {
      label: "Transactions",
      description: `${transactions.length} transaction entries`,
      icon: "💳",
      action: () => exportDataset("transactions", transactions),
      count: `${transactions.length} records`,
    },
    {
      label: "Expenses",
      description: `${expenses.length} expense records`,
      icon: "💸",
      action: () => exportDataset("expenses", expenses),
      count: `${expenses.length} records`,
    },
    {
      label: "Bank Accounts",
      description: `${bankAccounts.length} bank accounts`,
      icon: "🏦",
      action: () => exportDataset("bankAccounts", bankAccounts),
      count: `${bankAccounts.length} accounts`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="text-green-600" size={20} />
          <h2 className="text-base font-semibold text-slate-800">
            Export Data
          </h2>
          <span className="text-xs text-slate-500 ml-2">
            Download your data as JSON files
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exportItems.map((item) => (
            <div
              key={item.label}
              className="border border-[#e2e8f0] rounded-lg p-3 hover:border-green-300 hover:bg-green-50/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base mb-1">{item.icon}</div>
                  <h4 className="text-sm font-medium text-slate-800">
                    {item.label}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.count}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={item.action}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
              >
                <Download size={12} /> Export
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="text-green-600" size={20} />
          <h2 className="text-base font-semibold text-slate-800">
            Import Data
          </h2>
          <span className="text-xs text-slate-500 ml-2">
            Restore from a SANNARI JSON backup
          </span>
        </div>

        <div className="space-y-4">
          {/* File Upload Area */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#e2e8f0] rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors"
          >
            <FileJson size={36} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Click to select a JSON backup file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Only .json files exported from SANNARI are supported
            </p>
            {importFile && (
              <div className="mt-2 px-3 py-1.5 bg-green-100 text-green-800 rounded text-sm inline-block">
                📄 {importFile.name}
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Error */}
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle
                size={16}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          )}

          {/* Preview */}
          {importPreview && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Eye size={15} className="text-green-700" />
                <h4 className="text-sm font-semibold text-green-800">
                  Import Preview
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {importPreview.products !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-green-700">
                      {importPreview.products}
                    </div>
                    <div className="text-xs text-slate-500">Products</div>
                  </div>
                )}
                {importPreview.sales !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-green-700">
                      {importPreview.sales}
                    </div>
                    <div className="text-xs text-slate-500">Sales</div>
                  </div>
                )}
                {importPreview.purchases !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-orange-600">
                      {importPreview.purchases}
                    </div>
                    <div className="text-xs text-slate-500">Purchases</div>
                  </div>
                )}
                {importPreview.suppliers !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-slate-700">
                      {importPreview.suppliers}
                    </div>
                    <div className="text-xs text-slate-500">Suppliers</div>
                  </div>
                )}
                {importPreview.customers !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-slate-700">
                      {importPreview.customers}
                    </div>
                    <div className="text-xs text-slate-500">Customers</div>
                  </div>
                )}
                {importPreview.transactions !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-slate-700">
                      {importPreview.transactions}
                    </div>
                    <div className="text-xs text-slate-500">Transactions</div>
                  </div>
                )}
                {importPreview.expenses !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-red-600">
                      {importPreview.expenses}
                    </div>
                    <div className="text-xs text-slate-500">Expenses</div>
                  </div>
                )}
                {importPreview.bankAccounts !== undefined && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-teal-600">
                      {importPreview.bankAccounts}
                    </div>
                    <div className="text-xs text-slate-500">Bank Accts</div>
                  </div>
                )}
                {importPreview.settings && (
                  <div className="bg-white px-2 py-1.5 rounded text-center border border-green-100">
                    <div className="text-lg font-bold text-purple-600">✓</div>
                    <div className="text-xs text-slate-500">Settings</div>
                  </div>
                )}
              </div>

              {/* Import Mode */}
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Import Mode:
                </p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                      className="text-green-600"
                    />
                    <span className="text-sm text-slate-700">
                      Merge{" "}
                      <span className="text-xs text-slate-500">
                        (add new, keep existing)
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="text-red-600"
                    />
                    <span className="text-sm text-slate-700">
                      Replace{" "}
                      <span className="text-xs text-red-500">
                        (overwrite all data)
                      </span>
                    </span>
                  </label>
                </div>
                {importMode === "replace" && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> Warning: This will delete all
                    existing data and replace with imported data.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleImport}
                className="mt-3 flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                <Upload size={14} /> Confirm Import
              </button>
            </div>
          )}

          {/* Success */}
          {importSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Data imported successfully!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Current Data Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Products",
              count: products.length,
              color: "text-green-700",
            },
            { label: "Sales", count: sales.length, color: "text-green-700" },
            {
              label: "Purchases",
              count: purchases.length,
              color: "text-orange-600",
            },
            {
              label: "Suppliers",
              count: suppliers.length,
              color: "text-slate-700",
            },
            {
              label: "Customers",
              count: customers.length,
              color: "text-slate-700",
            },
            {
              label: "Transactions",
              count: transactions.length,
              color: "text-slate-700",
            },
            {
              label: "Expenses",
              count: expenses.length,
              color: "text-red-600",
            },
            {
              label: "Bank Accounts",
              count: bankAccounts.length,
              color: "text-teal-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-slate-50 rounded-md p-3 text-center"
            >
              <div className={`text-xl font-bold ${item.color}`}>
                {item.count}
              </div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
