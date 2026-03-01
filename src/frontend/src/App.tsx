import { Toaster } from "@/components/ui/sonner";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { CashBank } from "./modules/cashbank/CashBank";
import { Dashboard } from "./modules/dashboard/Dashboard";
import { ExpenseManagement } from "./modules/expenses/ExpenseManagement";
import { ImportExport } from "./modules/importexport/ImportExport";
import { Invoices } from "./modules/invoices/Invoices";
import { PartyManagement } from "./modules/parties/PartyManagement";
import { Purchase } from "./modules/purchase/Purchase";
import { Reports } from "./modules/reports/Reports";
import { Sales } from "./modules/sales/Sales";
import { Settings } from "./modules/settings/Settings";
import { StockManagement } from "./modules/stock/StockManagement";
import { StockAdjustment } from "./modules/stockadjustment/StockAdjustment";
import { Transactions } from "./modules/transactions/Transactions";
import { useStore } from "./store";
import { downloadJSON } from "./utils/helpers";

export type AppRoute =
  | "/"
  | "/sales"
  | "/purchase"
  | "/invoices"
  | "/stock"
  | "/stock-adjustment"
  | "/parties"
  | "/expenses"
  | "/cash-bank"
  | "/transactions"
  | "/reports"
  | "/settings"
  | "/import-export";

// Simple client-side router using state
export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("/");
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);

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
  } = useStore();

  // Auto-save is already handled -- all store mutations persist to localStorage immediately.
  // Show backup prompt before the user closes the tab.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      // Trigger auto backup download
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
        `sannari_autobak_${today}.json`,
      );
      // Show native browser "leave page?" dialog
      e.preventDefault();
      // Returning a non-empty string triggers the dialog in most browsers
      e.returnValue =
        "A backup has been downloaded. Are you sure you want to leave?";
      return e.returnValue;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    products,
    sales,
    purchases,
    suppliers,
    customers,
    transactions,
    expenses,
    bankAccounts,
    settings,
  ]);

  function navigate(route: AppRoute) {
    setCurrentRoute(route);
    window.history.pushState({}, "", route);
  }

  function handleManualBackup() {
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
    setShowBackupPrompt(false);
  }

  function renderPage() {
    switch (currentRoute) {
      case "/":
        return <Dashboard />;
      case "/sales":
        return <Sales />;
      case "/invoices":
        return <Invoices navigate={navigate} />;
      case "/purchase":
        return <Purchase />;
      case "/stock":
        return <StockManagement />;
      case "/stock-adjustment":
        return <StockAdjustment />;
      case "/parties":
        return <PartyManagement />;
      case "/expenses":
        return <ExpenseManagement />;
      case "/cash-bank":
        return <CashBank />;
      case "/transactions":
        return <Transactions />;
      case "/reports":
        return <Reports />;
      case "/settings":
        return <Settings />;
      case "/import-export":
        return <ImportExport />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar currentRoute={currentRoute} navigate={navigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentRoute={currentRoute} navigate={navigate} />
        <main className="flex-1 overflow-auto p-5">
          {renderPage()}

          {/* Footer */}
          <footer className="mt-8 pt-4 border-t border-[#e2e8f0] text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} SANNARI Accounting ERP — Groundnut
              Oil Mill Management System. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-500 hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </main>
      </div>
      <Toaster position="top-right" />

      {/* Manual Backup Prompt */}
      {showBackupPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h3 className="text-base font-semibold text-slate-800">
                Save Backup Before Closing
              </h3>
              <button
                type="button"
                onClick={() => setShowBackupPrompt(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                It is recommended to save a backup of your data before closing
                the application. Your data is auto-saved locally, but a backup
                file protects you from data loss.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleManualBackup}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  <Download size={14} /> Download Backup
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackupPrompt(false)}
                  className="px-4 py-2 text-sm border border-[#e2e8f0] text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
