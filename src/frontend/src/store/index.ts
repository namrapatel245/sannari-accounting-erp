import { create } from "zustand";
import {
  defaultSettings,
  sampleBankAccounts,
  sampleCustomers,
  sampleExpenses,
  sampleProducts,
  samplePurchases,
  sampleSales,
  sampleStockAdjustments,
  sampleSuppliers,
  sampleTransactions,
} from "../data/sampleData";
import type {
  BankAccount,
  Customer,
  Expense,
  PaymentIn,
  PaymentOut,
  Product,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Settings,
  StockAdjustment,
  Supplier,
  Transaction,
} from "../types";
import { generateId } from "../utils/helpers";

// localStorage keys
const KEYS = {
  products: "sannari_products",
  sales: "sannari_sales",
  purchases: "sannari_purchases",
  suppliers: "sannari_suppliers",
  customers: "sannari_customers",
  transactions: "sannari_transactions",
  expenses: "sannari_expenses",
  settings: "sannari_settings",
  sidebarCollapsed: "sannari_sidebar",
  bankAccounts: "sannari_bankAccounts",
  stockAdjustments: "sannari_stockAdjustments",
  paymentIns: "sannari_paymentIns",
  paymentOuts: "sannari_paymentOuts",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface StoreState {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  expenses: Expense[];
  settings: Settings;
  sidebarCollapsed: boolean;
  bankAccounts: BankAccount[];
  stockAdjustments: StockAdjustment[];
  paymentIns: PaymentIn[];
  paymentOuts: PaymentOut[];

  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Settings
  updateSettings: (s: Partial<Settings>) => void;

  // Products
  addProduct: (p: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateProductQuantity: (id: string, delta: number) => void;

  // Sales
  addSale: (s: Omit<Sale, "id" | "createdAt">) => Sale;
  updateSale: (id: string, s: Partial<Sale>, originalItems: SaleItem[]) => void;
  deleteSale: (id: string) => void;

  // Purchases
  addPurchase: (p: Omit<Purchase, "id" | "createdAt">) => Purchase;
  updatePurchase: (
    id: string,
    p: Partial<Purchase>,
    originalItems: PurchaseItem[],
  ) => void;
  deletePurchase: (id: string) => void;

  // Suppliers
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Customers
  addCustomer: (c: Omit<Customer, "id">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Transactions
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactionsByRef: (refNumber: string) => void;

  // Expenses
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Bank Accounts
  addBankAccount: (b: Omit<BankAccount, "id" | "createdAt">) => void;
  updateBankAccount: (id: string, b: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Stock Adjustments
  addStockAdjustment: (a: Omit<StockAdjustment, "id" | "createdAt">) => void;

  // Payment In
  addPaymentIn: (p: Omit<PaymentIn, "id" | "createdAt">) => void;
  deletePaymentIn: (id: string) => void;

  // Payment Out
  addPaymentOut: (p: Omit<PaymentOut, "id" | "createdAt">) => void;
  deletePaymentOut: (id: string) => void;

  // Import
  importData: (data: Partial<StoreData>, mode: "replace" | "merge") => void;

  // Clear All Data
  clearAllData: () => void;

  // Computed helpers
  getCashBalance: () => number;
  getReceivables: () => number;
  getPayables: () => number;
}

interface StoreData {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  expenses: Expense[];
  settings: Settings;
  bankAccounts: BankAccount[];
  stockAdjustments: StockAdjustment[];
  paymentIns: PaymentIn[];
  paymentOuts: PaymentOut[];
}

// Initialize from localStorage or sample data
const initialProducts = load<Product[]>(KEYS.products, []);
const initialSales = load<Sale[]>(KEYS.sales, []);
const initialPurchases = load<Purchase[]>(KEYS.purchases, []);
const initialSuppliers = load<Supplier[]>(KEYS.suppliers, []);
const initialCustomers = load<Customer[]>(KEYS.customers, []);
const initialTransactions = load<Transaction[]>(KEYS.transactions, []);
const initialExpenses = load<Expense[]>(KEYS.expenses, []);
const initialSettings = load<Settings>(KEYS.settings, defaultSettings);
const initialSidebarCollapsed = load<boolean>(KEYS.sidebarCollapsed, false);
const initialBankAccounts = load<BankAccount[]>(KEYS.bankAccounts, []);
const initialStockAdjustments = load<StockAdjustment[]>(
  KEYS.stockAdjustments,
  [],
);
const initialPaymentIns = load<PaymentIn[]>(KEYS.paymentIns, []);
const initialPaymentOuts = load<PaymentOut[]>(KEYS.paymentOuts, []);

// Seed with sample data if empty
const seeded = localStorage.getItem("sannari_seeded_v2");
if (!seeded) {
  localStorage.setItem(KEYS.products, JSON.stringify(sampleProducts));
  localStorage.setItem(KEYS.sales, JSON.stringify(sampleSales));
  localStorage.setItem(KEYS.purchases, JSON.stringify(samplePurchases));
  localStorage.setItem(KEYS.suppliers, JSON.stringify(sampleSuppliers));
  localStorage.setItem(KEYS.customers, JSON.stringify(sampleCustomers));
  localStorage.setItem(KEYS.transactions, JSON.stringify(sampleTransactions));
  localStorage.setItem(KEYS.expenses, JSON.stringify(sampleExpenses));
  localStorage.setItem(KEYS.settings, JSON.stringify(defaultSettings));
  localStorage.setItem(KEYS.bankAccounts, JSON.stringify(sampleBankAccounts));
  localStorage.setItem(
    KEYS.stockAdjustments,
    JSON.stringify(sampleStockAdjustments),
  );
  localStorage.setItem(KEYS.paymentIns, JSON.stringify([]));
  localStorage.setItem(KEYS.paymentOuts, JSON.stringify([]));
  localStorage.setItem("sannari_seeded_v2", "true");
}

const getInitial = <T>(key: string, sample: T, stored: T): T => {
  return load<T>(key, sample) || stored;
};

export const useStore = create<StoreState>((set, get) => ({
  products: getInitial(KEYS.products, sampleProducts, initialProducts),
  sales: getInitial(KEYS.sales, sampleSales, initialSales),
  purchases: getInitial(KEYS.purchases, samplePurchases, initialPurchases),
  suppliers: getInitial(KEYS.suppliers, sampleSuppliers, initialSuppliers),
  customers: getInitial(KEYS.customers, sampleCustomers, initialCustomers),
  transactions: getInitial(
    KEYS.transactions,
    sampleTransactions,
    initialTransactions,
  ),
  expenses: getInitial(KEYS.expenses, sampleExpenses, initialExpenses),
  settings: initialSettings,
  sidebarCollapsed: initialSidebarCollapsed,
  bankAccounts: getInitial(
    KEYS.bankAccounts,
    sampleBankAccounts,
    initialBankAccounts,
  ),
  stockAdjustments: getInitial(
    KEYS.stockAdjustments,
    sampleStockAdjustments,
    initialStockAdjustments,
  ),
  paymentIns: initialPaymentIns,
  paymentOuts: initialPaymentOuts,

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    save(KEYS.sidebarCollapsed, next);
    set({ sidebarCollapsed: next });
  },

  setSidebarCollapsed: (v) => {
    save(KEYS.sidebarCollapsed, v);
    set({ sidebarCollapsed: v });
  },

  updateSettings: (s) => {
    const next = { ...get().settings, ...s };
    save(KEYS.settings, next);
    set({ settings: next });
  },

  // Products
  addProduct: (p) => {
    const product: Product = {
      ...p,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().products, product];
    save(KEYS.products, next);
    set({ products: next });
  },

  updateProduct: (id, p) => {
    const next = get().products.map((x) => (x.id === id ? { ...x, ...p } : x));
    save(KEYS.products, next);
    set({ products: next });
  },

  deleteProduct: (id) => {
    const next = get().products.filter((x) => x.id !== id);
    save(KEYS.products, next);
    set({ products: next });
  },

  updateProductQuantity: (id, delta) => {
    const next = get().products.map((x) =>
      x.id === id ? { ...x, quantity: Math.max(0, x.quantity + delta) } : x,
    );
    save(KEYS.products, next);
    set({ products: next });
  },

  // Sales
  addSale: (s) => {
    const sale: Sale = {
      ...s,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const nextSales = [...get().sales, sale];
    save(KEYS.sales, nextSales);

    // Update stock - decrease
    const products = [...get().products];
    for (const item of sale.items) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: Math.max(0, products[idx].quantity - item.quantity),
        };
      }
    }
    save(KEYS.products, products);

    // Create transaction
    const txn: Transaction = {
      id: generateId(),
      date: sale.date,
      type: "Sale",
      referenceNumber: sale.billNumber,
      partyName: sale.customerName,
      amount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      notes: sale.narration,
    };
    const nextTxns = [...get().transactions, txn];
    save(KEYS.transactions, nextTxns);

    set({ sales: nextSales, products, transactions: nextTxns });
    return sale;
  },

  updateSale: (id, updates, originalItems) => {
    const products = [...get().products];

    // Reverse original stock changes
    for (const item of originalItems) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: products[idx].quantity + item.quantity,
        };
      }
    }

    const updatedSale = {
      ...get().sales.find((s) => s.id === id)!,
      ...updates,
    };

    // Apply new stock changes
    for (const item of updatedSale.items || []) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: Math.max(0, products[idx].quantity - item.quantity),
        };
      }
    }

    const nextSales = get().sales.map((s) => (s.id === id ? updatedSale : s));
    save(KEYS.sales, nextSales);
    save(KEYS.products, products);

    // Update transaction
    const nextTxns = get().transactions.map((t) =>
      t.referenceNumber === updatedSale.billNumber
        ? {
            ...t,
            amount: updatedSale.totalAmount,
            partyName: updatedSale.customerName,
            paymentMethod: updatedSale.paymentMethod,
          }
        : t,
    );
    save(KEYS.transactions, nextTxns);

    set({ sales: nextSales, products, transactions: nextTxns });
  },

  deleteSale: (id) => {
    const sale = get().sales.find((s) => s.id === id);
    if (!sale) return;

    // Reverse stock
    const products = [...get().products];
    for (const item of sale.items) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: products[idx].quantity + item.quantity,
        };
      }
    }
    save(KEYS.products, products);

    const nextSales = get().sales.filter((s) => s.id !== id);
    save(KEYS.sales, nextSales);

    const nextTxns = get().transactions.filter(
      (t) => t.referenceNumber !== sale.billNumber,
    );
    save(KEYS.transactions, nextTxns);

    set({ sales: nextSales, products, transactions: nextTxns });
  },

  // Purchases
  addPurchase: (p) => {
    const purchase: Purchase = {
      ...p,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const nextPurchases = [...get().purchases, purchase];
    save(KEYS.purchases, nextPurchases);

    // Update stock - increase
    const products = [...get().products];
    for (const item of purchase.items) {
      const idx = products.findIndex((pr) => pr.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: products[idx].quantity + item.quantity,
        };
      }
    }
    save(KEYS.products, products);

    // Create transaction
    const txn: Transaction = {
      id: generateId(),
      date: purchase.date,
      type: "Purchase",
      referenceNumber: purchase.billNumber,
      partyName: purchase.supplierName,
      amount: purchase.totalAmount,
      paymentMethod: purchase.paymentMethod,
      notes: purchase.narration,
    };
    const nextTxns = [...get().transactions, txn];
    save(KEYS.transactions, nextTxns);

    set({ purchases: nextPurchases, products, transactions: nextTxns });
    return purchase;
  },

  updatePurchase: (id, updates, originalItems) => {
    const products = [...get().products];

    // Reverse original stock changes (decrease back)
    for (const item of originalItems) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: Math.max(0, products[idx].quantity - item.quantity),
        };
      }
    }

    const updatedPurchase = {
      ...get().purchases.find((p) => p.id === id)!,
      ...updates,
    };

    // Apply new stock changes
    for (const item of updatedPurchase.items || []) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: products[idx].quantity + item.quantity,
        };
      }
    }

    const nextPurchases = get().purchases.map((p) =>
      p.id === id ? updatedPurchase : p,
    );
    save(KEYS.purchases, nextPurchases);
    save(KEYS.products, products);

    const nextTxns = get().transactions.map((t) =>
      t.referenceNumber === updatedPurchase.billNumber
        ? {
            ...t,
            amount: updatedPurchase.totalAmount,
            partyName: updatedPurchase.supplierName,
            paymentMethod: updatedPurchase.paymentMethod,
          }
        : t,
    );
    save(KEYS.transactions, nextTxns);

    set({ purchases: nextPurchases, products, transactions: nextTxns });
  },

  deletePurchase: (id) => {
    const purchase = get().purchases.find((p) => p.id === id);
    if (!purchase) return;

    // Reverse stock
    const products = [...get().products];
    for (const item of purchase.items) {
      const idx = products.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          quantity: Math.max(0, products[idx].quantity - item.quantity),
        };
      }
    }
    save(KEYS.products, products);

    const nextPurchases = get().purchases.filter((p) => p.id !== id);
    save(KEYS.purchases, nextPurchases);

    const nextTxns = get().transactions.filter(
      (t) => t.referenceNumber !== purchase.billNumber,
    );
    save(KEYS.transactions, nextTxns);

    set({ purchases: nextPurchases, products, transactions: nextTxns });
  },

  // Suppliers
  addSupplier: (s) => {
    const supplier: Supplier = { ...s, id: generateId() };
    const next = [...get().suppliers, supplier];
    save(KEYS.suppliers, next);
    set({ suppliers: next });
  },

  updateSupplier: (id, s) => {
    const next = get().suppliers.map((x) => (x.id === id ? { ...x, ...s } : x));
    save(KEYS.suppliers, next);
    set({ suppliers: next });
  },

  deleteSupplier: (id) => {
    const next = get().suppliers.filter((x) => x.id !== id);
    save(KEYS.suppliers, next);
    set({ suppliers: next });
  },

  // Customers
  addCustomer: (c) => {
    const customer: Customer = { ...c, id: generateId() };
    const next = [...get().customers, customer];
    save(KEYS.customers, next);
    set({ customers: next });
  },

  updateCustomer: (id, c) => {
    const next = get().customers.map((x) => (x.id === id ? { ...x, ...c } : x));
    save(KEYS.customers, next);
    set({ customers: next });
  },

  deleteCustomer: (id) => {
    const next = get().customers.filter((x) => x.id !== id);
    save(KEYS.customers, next);
    set({ customers: next });
  },

  // Transactions
  addTransaction: (t) => {
    const txn: Transaction = { ...t, id: generateId() };
    const next = [...get().transactions, txn];
    save(KEYS.transactions, next);
    set({ transactions: next });
  },

  updateTransaction: (id, t) => {
    const next = get().transactions.map((x) =>
      x.id === id ? { ...x, ...t } : x,
    );
    save(KEYS.transactions, next);
    set({ transactions: next });
  },

  deleteTransaction: (id) => {
    const next = get().transactions.filter((x) => x.id !== id);
    save(KEYS.transactions, next);
    set({ transactions: next });
  },

  deleteTransactionsByRef: (refNumber) => {
    const next = get().transactions.filter(
      (t) => t.referenceNumber !== refNumber,
    );
    save(KEYS.transactions, next);
    set({ transactions: next });
  },

  // Expenses
  addExpense: (e) => {
    const expense: Expense = {
      ...e,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const nextExpenses = [...get().expenses, expense];
    save(KEYS.expenses, nextExpenses);

    // Create transaction
    const txn: Transaction = {
      id: generateId(),
      date: expense.date,
      type: "Expense",
      referenceNumber: `EXP-${expense.id.toUpperCase()}`,
      partyName: expense.party,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    };
    const nextTxns = [...get().transactions, txn];
    save(KEYS.transactions, nextTxns);

    set({ expenses: nextExpenses, transactions: nextTxns });
  },

  updateExpense: (id, e) => {
    const next = get().expenses.map((x) => (x.id === id ? { ...x, ...e } : x));
    save(KEYS.expenses, next);
    set({ expenses: next });
  },

  deleteExpense: (id) => {
    const expense = get().expenses.find((e) => e.id === id);
    if (expense) {
      const nextTxns = get().transactions.filter(
        (t) => t.referenceNumber !== `EXP-${expense.id.toUpperCase()}`,
      );
      save(KEYS.transactions, nextTxns);
      set({ transactions: nextTxns });
    }
    const next = get().expenses.filter((e) => e.id !== id);
    save(KEYS.expenses, next);
    set({ expenses: next });
  },

  // Bank Accounts
  addBankAccount: (b) => {
    const account: BankAccount = {
      ...b,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().bankAccounts, account];
    save(KEYS.bankAccounts, next);
    set({ bankAccounts: next });
  },

  updateBankAccount: (id, b) => {
    const next = get().bankAccounts.map((x) =>
      x.id === id ? { ...x, ...b } : x,
    );
    save(KEYS.bankAccounts, next);
    set({ bankAccounts: next });
  },

  deleteBankAccount: (id) => {
    const next = get().bankAccounts.filter((x) => x.id !== id);
    save(KEYS.bankAccounts, next);
    set({ bankAccounts: next });
  },

  // Stock Adjustments
  addStockAdjustment: (a) => {
    const adjustment: StockAdjustment = {
      ...a,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().stockAdjustments, adjustment];
    save(KEYS.stockAdjustments, next);

    // Update product quantity
    const delta = a.adjustmentType === "Add" ? a.quantity : -a.quantity;
    const products = get().products.map((p) =>
      p.id === a.productId
        ? { ...p, quantity: Math.max(0, p.quantity + delta) }
        : p,
    );
    save(KEYS.products, products);

    set({ stockAdjustments: next, products });
  },

  // Payment In
  addPaymentIn: (p) => {
    const payment: PaymentIn = {
      ...p,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().paymentIns, payment];
    save(KEYS.paymentIns, next);

    // Create transaction
    const txn: Transaction = {
      id: generateId(),
      date: payment.date,
      type: "PaymentIn",
      referenceNumber: `PIN-${payment.id.toUpperCase()}`,
      partyName: payment.customerName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
    };
    const nextTxns = [...get().transactions, txn];
    save(KEYS.transactions, nextTxns);

    set({ paymentIns: next, transactions: nextTxns });
  },

  deletePaymentIn: (id) => {
    const payment = get().paymentIns.find((p) => p.id === id);
    if (payment) {
      const nextTxns = get().transactions.filter(
        (t) => t.referenceNumber !== `PIN-${payment.id.toUpperCase()}`,
      );
      save(KEYS.transactions, nextTxns);
      set({ transactions: nextTxns });
    }
    const next = get().paymentIns.filter((p) => p.id !== id);
    save(KEYS.paymentIns, next);
    set({ paymentIns: next });
  },

  // Payment Out
  addPaymentOut: (p) => {
    const payment: PaymentOut = {
      ...p,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().paymentOuts, payment];
    save(KEYS.paymentOuts, next);

    // Create transaction
    const txn: Transaction = {
      id: generateId(),
      date: payment.date,
      type: "PaymentOut",
      referenceNumber: `POUT-${payment.id.toUpperCase()}`,
      partyName: payment.supplierName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
    };
    const nextTxns = [...get().transactions, txn];
    save(KEYS.transactions, nextTxns);

    set({ paymentOuts: next, transactions: nextTxns });
  },

  deletePaymentOut: (id) => {
    const payment = get().paymentOuts.find((p) => p.id === id);
    if (payment) {
      const nextTxns = get().transactions.filter(
        (t) => t.referenceNumber !== `POUT-${payment.id.toUpperCase()}`,
      );
      save(KEYS.transactions, nextTxns);
      set({ transactions: nextTxns });
    }
    const next = get().paymentOuts.filter((p) => p.id !== id);
    save(KEYS.paymentOuts, next);
    set({ paymentOuts: next });
  },

  // Import
  importData: (data, mode) => {
    if (mode === "replace") {
      if (data.products) {
        save(KEYS.products, data.products);
        set({ products: data.products });
      }
      if (data.sales) {
        save(KEYS.sales, data.sales);
        set({ sales: data.sales });
      }
      if (data.purchases) {
        save(KEYS.purchases, data.purchases);
        set({ purchases: data.purchases });
      }
      if (data.suppliers) {
        save(KEYS.suppliers, data.suppliers);
        set({ suppliers: data.suppliers });
      }
      if (data.customers) {
        save(KEYS.customers, data.customers);
        set({ customers: data.customers });
      }
      if (data.transactions) {
        save(KEYS.transactions, data.transactions);
        set({ transactions: data.transactions });
      }
      if (data.expenses) {
        save(KEYS.expenses, data.expenses);
        set({ expenses: data.expenses });
      }
      if (data.settings) {
        save(KEYS.settings, data.settings);
        set({ settings: data.settings });
      }
      if (data.bankAccounts) {
        save(KEYS.bankAccounts, data.bankAccounts);
        set({ bankAccounts: data.bankAccounts });
      }
      if (data.stockAdjustments) {
        save(KEYS.stockAdjustments, data.stockAdjustments);
        set({ stockAdjustments: data.stockAdjustments });
      }
      if (data.paymentIns) {
        save(KEYS.paymentIns, data.paymentIns);
        set({ paymentIns: data.paymentIns });
      }
      if (data.paymentOuts) {
        save(KEYS.paymentOuts, data.paymentOuts);
        set({ paymentOuts: data.paymentOuts });
      }
    } else {
      // Merge - add new items by id
      const merge = <T extends { id: string }>(
        existing: T[],
        incoming: T[],
      ): T[] => {
        const ids = new Set(existing.map((x) => x.id));
        return [...existing, ...incoming.filter((x) => !ids.has(x.id))];
      };
      if (data.products) {
        const next = merge(get().products, data.products);
        save(KEYS.products, next);
        set({ products: next });
      }
      if (data.sales) {
        const next = merge(get().sales, data.sales);
        save(KEYS.sales, next);
        set({ sales: next });
      }
      if (data.purchases) {
        const next = merge(get().purchases, data.purchases);
        save(KEYS.purchases, next);
        set({ purchases: next });
      }
      if (data.suppliers) {
        const next = merge(get().suppliers, data.suppliers);
        save(KEYS.suppliers, next);
        set({ suppliers: next });
      }
      if (data.customers) {
        const next = merge(get().customers, data.customers);
        save(KEYS.customers, next);
        set({ customers: next });
      }
      if (data.transactions) {
        const next = merge(get().transactions, data.transactions);
        save(KEYS.transactions, next);
        set({ transactions: next });
      }
      if (data.expenses) {
        const next = merge(get().expenses, data.expenses);
        save(KEYS.expenses, next);
        set({ expenses: next });
      }
      if (data.bankAccounts) {
        const next = merge(get().bankAccounts, data.bankAccounts);
        save(KEYS.bankAccounts, next);
        set({ bankAccounts: next });
      }
      if (data.stockAdjustments) {
        const next = merge(get().stockAdjustments, data.stockAdjustments);
        save(KEYS.stockAdjustments, next);
        set({ stockAdjustments: next });
      }
      if (data.paymentIns) {
        const next = merge(get().paymentIns, data.paymentIns);
        save(KEYS.paymentIns, next);
        set({ paymentIns: next });
      }
      if (data.paymentOuts) {
        const next = merge(get().paymentOuts, data.paymentOuts);
        save(KEYS.paymentOuts, next);
        set({ paymentOuts: next });
      }
    }
  },

  // Clear All Data
  clearAllData: () => {
    const emptyState = {
      products: [],
      sales: [],
      purchases: [],
      suppliers: [],
      customers: [],
      transactions: [],
      expenses: [],
      bankAccounts: [],
      stockAdjustments: [],
      paymentIns: [],
      paymentOuts: [],
    };
    for (const [k, v] of Object.entries(emptyState)) {
      save(KEYS[k as keyof typeof KEYS], v);
    }
    set(emptyState);
  },

  // Computed helpers
  getCashBalance: () => {
    const { sales, purchases, expenses, paymentIns, paymentOuts } = get();
    const cashSales = sales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const cashPurchases = purchases
      .filter((p) => p.paymentMethod === "Cash")
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const cashExpenses = expenses
      .filter((e) => e.paymentMethod === "Cash")
      .reduce((sum, e) => sum + e.amount, 0);
    const cashIn = paymentIns
      .filter((p) => p.paymentMethod === "Cash")
      .reduce((sum, p) => sum + p.amount, 0);
    const cashOut = paymentOuts
      .filter((p) => p.paymentMethod === "Cash")
      .reduce((sum, p) => sum + p.amount, 0);
    return cashSales - cashPurchases - cashExpenses + cashIn - cashOut;
  },

  getReceivables: () => {
    const { sales, paymentIns } = get();
    const creditSales = sales
      .filter((s) => s.paymentMethod === "Credit" && s.paymentStatus !== "Paid")
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPaymentsIn = paymentIns.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, creditSales - totalPaymentsIn);
  },

  getPayables: () => {
    const { purchases, paymentOuts } = get();
    const creditPurchases = purchases
      .filter((p) => p.paymentMethod === "Credit" && p.paymentStatus !== "Paid")
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPaymentsOut = paymentOuts.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, creditPurchases - totalPaymentsOut);
  },
}));
