import {
  Menu,
  Package,
  Search,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppRoute } from "../../App";
import { useStore } from "../../store";

const pageTitles: Record<AppRoute, string> = {
  "/": "Dashboard",
  "/sales": "Sales / Invoice",
  "/invoices": "Invoices",
  "/purchase": "Purchase",
  "/stock": "Stock Management",
  "/stock-adjustment": "Stock Adjustment",
  "/parties": "Party Management",
  "/expenses": "Expense Management",
  "/cash-bank": "Cash & Bank",
  "/transactions": "Transactions",
  "/reports": "Reports",
  "/settings": "Settings",
  "/import-export": "Import / Export",
};

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel?: string;
  path: AppRoute;
}

interface HeaderProps {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

export function Header({ currentRoute, navigate }: HeaderProps) {
  const { products, sales, purchases, suppliers, customers, toggleSidebar } =
    useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[currentRoute] || "SANNARI ERP";

  const doSearch = useCallback(
    (q: string) => {
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      const ql = q.toLowerCase();
      const results: SearchResult[] = [];

      for (const p of products
        .filter((p) => p.name.toLowerCase().includes(ql))
        .slice(0, 3)) {
        results.push({
          type: "Products",
          id: p.id,
          label: p.name,
          sublabel: `${p.category} • ${p.unit}`,
          path: "/stock",
        });
      }
      for (const s of sales
        .filter(
          (s) =>
            s.billNumber.toLowerCase().includes(ql) ||
            s.customerName.toLowerCase().includes(ql),
        )
        .slice(0, 3)) {
        results.push({
          type: "Sales",
          id: s.id,
          label: s.billNumber,
          sublabel: s.customerName,
          path: "/sales",
        });
      }
      for (const p of purchases
        .filter(
          (p) =>
            p.billNumber.toLowerCase().includes(ql) ||
            p.supplierName.toLowerCase().includes(ql),
        )
        .slice(0, 3)) {
        results.push({
          type: "Purchases",
          id: p.id,
          label: p.billNumber,
          sublabel: p.supplierName,
          path: "/purchase",
        });
      }
      for (const s of suppliers
        .filter((s) => s.name.toLowerCase().includes(ql))
        .slice(0, 2)) {
        results.push({
          type: "Suppliers",
          id: s.id,
          label: s.name,
          sublabel: s.phone,
          path: "/parties",
        });
      }
      for (const c of customers
        .filter((c) => c.name.toLowerCase().includes(ql))
        .slice(0, 2)) {
        results.push({
          type: "Customers",
          id: c.id,
          label: c.name,
          sublabel: c.phone,
          path: "/parties",
        });
      }

      setSearchResults(results);
    },
    [products, sales, purchases, suppliers, customers],
  );

  useEffect(() => {
    doSearch(searchQuery);
    setShowResults(searchQuery.length >= 2);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleResultClick(result: SearchResult) {
    navigate(result.path);
    setSearchQuery("");
    setShowResults(false);
  }

  const grouped = searchResults.reduce<Record<string, SearchResult[]>>(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {},
  );

  const typeIcons: Record<string, React.ReactNode> = {
    Products: <Package size={13} />,
    Sales: <ShoppingCart size={13} />,
    Purchases: <Truck size={13} />,
    Suppliers: <Users size={13} />,
    Customers: <UserCheck size={13} />,
  };

  return (
    <header className="flex items-center h-16 bg-white border-b border-[#e2e8f0] px-4 gap-4 flex-shrink-0 z-20">
      {/* Hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
        title="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page Title */}
      <div className="hidden md:block">
        <h1 className="text-base font-semibold text-slate-800">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-lg relative ml-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search products, bills, parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                No results found
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 flex items-center gap-1.5">
                    {typeIcons[type]}
                    {type} ({items.length})
                  </div>
                  {items.map((result) => (
                    <button
                      type="button"
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {result.label}
                        </div>
                        {result.sublabel && (
                          <div className="text-xs text-slate-500">
                            {result.sublabel}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right side - intentionally empty */}
      <div className="ml-auto" />
    </header>
  );
}
