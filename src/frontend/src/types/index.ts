export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  gstPercent: number;
  hsnCode: string;
  gstAmount: number;
}

export interface Sale {
  id: string;
  billNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerMobile?: string;
  narration: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "Bank" | "UPI" | "Credit";
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  discountTotal: number;
  gstTotal: number;
  subtotal: number;
  bankAccountId?: string;
  bankAccountName?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  gstPercent: number;
  hsnCode: string;
  gstAmount: number;
}

export interface Purchase {
  id: string;
  billNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  narration: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: "Cash" | "Bank" | "UPI" | "Credit";
  paymentStatus: "Paid" | "Unpaid" | "Partial";
  gstTotal: number;
  subtotal: number;
  bankAccountId?: string;
  bankAccountName?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  gst: string;
  openingBalance: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  gst: string;
  openingBalance: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Sale" | "Purchase" | "Expense" | "PaymentIn" | "PaymentOut";
  referenceNumber: string;
  partyName: string;
  amount: number;
  paymentMethod: string;
  notes: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  party: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  ifsc: string;
  balance: number;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  adjustmentType: "Add" | "Remove";
  quantity: number;
  reason: string;
  date: string;
  createdAt: string;
}

export interface PaymentIn {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface PaymentOut {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface Settings {
  businessName: string;
  address: string;
  phone: string;
  gst: string;
  businessType: string;
  invoicePrefix: string;
  purchasePrefix: string;
  termsConditions: string;
  categories: string[];
  expenseCategories: string[];
  whatsappNumber: string;
  logoBase64: string;
}

export type PaymentMethod = "Cash" | "Bank" | "UPI" | "Credit";
