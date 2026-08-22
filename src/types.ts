export type VoucherType = 'CREDIT' | 'DEBIT' | 'CONTRA' | 'JOURNAL';

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';

export interface Permissions {
  // Credit Voucher
  viewCreditVoucher: boolean;
  createCreditVoucher: boolean;
  editCreditVoucher: boolean;
  deleteCreditVoucher: boolean;

  // Debit Voucher
  viewDebitVoucher: boolean;
  createDebitVoucher: boolean;
  editDebitVoucher: boolean;
  deleteDebitVoucher: boolean;

  // Contra Voucher
  viewContraVoucher: boolean;
  createContraVoucher: boolean;
  editContraVoucher: boolean;
  deleteContraVoucher: boolean;

  // Journal Voucher
  viewJournalVoucher: boolean;
  createJournalVoucher: boolean;
  editJournalVoucher: boolean;
  deleteJournalVoucher: boolean;

  // Ledger & Financial Reports
  viewLedger: boolean;
  viewReports: boolean;

  // Accounts Management
  viewAccounts: boolean;
  manageAccounts: boolean;

  // Admin & User Control
  manageUsers: boolean;
  manageSettings: boolean;
  viewAuditLogs: boolean;

  // Actions
  printVouchers: boolean;
  exportPdf: boolean;
}

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'CASHIER' | 'AUDITOR' | 'CUSTOM';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  permissions: Permissions;
  createdAt: string;
  lastLogin?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  type: 'CASH' | 'BANK' | 'CUSTOMER' | 'VENDOR' | 'EXPENSE' | 'INCOME' | 'OTHER';
  openingBalance: number;
  currentBalance: number;
  description?: string;
  bankAccountNumber?: string;
  bankName?: string;
  isActive: boolean;
}

export interface VoucherItem {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string; // e.g. CRV-2026-0001, CPV-2026-0001, CV-2026-0001, JV-2026-0001
  type: VoucherType;
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  referenceNumber?: string; // Cheque No / Ref No / Online TXN ID
  chequeDate?: string;
  bankName?: string;
  paidToOrReceivedFrom: string; // Person / Company
  narration: string; // Main description
  items: VoucherItem[];
  totalAmount: number;
  amountInWords: string;
  preparedBy: string;
  checkedBy?: string;
  approvedBy?: string;
  receivedBy?: string;
  status: 'POSTED' | 'DRAFT' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE_VOUCHER' | 'EDIT_VOUCHER' | 'DELETE_VOUCHER' | 'LOGIN' | 'LOGOUT' | 'UPDATE_PERMISSIONS' | 'CREATE_USER' | 'UPDATE_SETTINGS' | 'CREATE_ACCOUNT';
  details: string;
  voucherNumber?: string;
  ipAddress?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  ntnOrTaxId: string;
  currencySymbol: string; // e.g. Rs., PKR, $, €
  currencyName: string; // e.g. Rupees, Dollars
  creditPrefix: string;
  debitPrefix: string;
  contraPrefix: string;
  journalPrefix: string;
  preparedByTitle: string;
  checkedByTitle: string;
  approvedByTitle: string;
  receivedByTitle: string;
  watermarkText?: string;
  termsAndConditions?: string;
}

export interface LedgerEntry {
  date: string;
  voucherId: string;
  voucherNumber: string;
  voucherType: VoucherType;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  referenceNumber?: string;
}
