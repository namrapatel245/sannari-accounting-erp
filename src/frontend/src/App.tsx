import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
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

  function navigate(route: AppRoute) {
    setCurrentRoute(route);
    window.history.pushState({}, "", route);
  }

  // Listen to browser back/forward
  // (simple approach for SPA)
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
                className="text-blue-500 hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
