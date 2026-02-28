import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  Layers,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Upload,
  Users,
} from "lucide-react";
import type { AppRoute } from "../../App";
import { useStore } from "../../store";

interface NavGroup {
  label?: string;
  items: Array<{
    to: AppRoute;
    label: string;
    icon: React.ElementType;
  }>;
}

const navGroups: NavGroup[] = [
  {
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "TRANSACTIONS",
    items: [
      { to: "/sales", label: "Sales / Invoice", icon: ShoppingCart },
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/purchase", label: "Purchase", icon: Package },
      { to: "/expenses", label: "Expenses", icon: ReceiptText },
      { to: "/cash-bank", label: "Cash & Bank", icon: Landmark },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { to: "/stock", label: "Stock Management", icon: Boxes },
      {
        to: "/stock-adjustment",
        label: "Stock Adjustment",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "PARTIES",
    items: [{ to: "/parties", label: "Party Management", icon: Users }],
  },
  {
    label: "FINANCE",
    items: [
      { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/import-export", label: "Import / Export", icon: Upload },
    ],
  },
];

interface SidebarProps {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

export function Sidebar({ currentRoute, navigate }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#0f172a] text-white transition-all duration-300 ease-in-out flex-shrink-0 relative z-10",
        sidebarCollapsed ? "w-[60px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 flex-shrink-0",
          sidebarCollapsed ? "px-3 py-4 justify-center" : "px-4 py-4",
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-600 flex-shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-2.5 overflow-hidden">
            <div className="text-sm font-bold text-white leading-tight whitespace-nowrap">
              SANNARI
            </div>
            <div className="text-[10px] text-blue-300 leading-tight whitespace-nowrap">
              Accounting ERP
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, gi) => (
          <div
            key={group.label ?? "home"}
            className={cn(!sidebarCollapsed && gi > 0 && "mt-1")}
          >
            {!sidebarCollapsed && group.label && (
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider">
                  {group.label}
                </span>
              </div>
            )}
            {sidebarCollapsed && group.label && gi > 0 && (
              <div className="border-t border-white/10 mx-3 my-1" />
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.to;
              return (
                <button
                  type="button"
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 mb-0.5 rounded-md transition-colors duration-150",
                    sidebarCollapsed
                      ? "px-0 py-2.5 justify-center mx-auto w-[44px]"
                      : "mx-2 px-3 py-2",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2 flex-shrink-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-2 w-full rounded-md px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
            sidebarCollapsed && "justify-center px-0",
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
