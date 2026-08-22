import React, { useEffect, useState } from 'react';
import { ChartOfAccounts } from './components/Accounts/ChartOfAccounts';
import { AuditLogs } from './components/Audit/AuditLogs';
import { LoginModal } from './components/Auth/LoginModal';
import { CashBankBook } from './components/CashBank/CashBankBook';
import { Dashboard } from './components/Dashboard';
import { DayBook } from './components/DayBook/DayBook';
import { GeneralLedger } from './components/Ledger/GeneralLedger';
import { Navbar } from './components/Navbar';
import { PartyStatement } from './components/PartyStatement/PartyStatement';
import { FinancialReports } from './components/Reports/FinancialReports';
import { CompanySettingsView } from './components/Settings/CompanySettings';
import { SupabaseSettings } from './components/Settings/SupabaseSettings';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { UserManagement } from './components/Users/UserManagement';
import { VoucherFormModal } from './components/Vouchers/VoucherFormModal';
import { VouchersList } from './components/Vouchers/VouchersList';
import { VoucherWindowModal } from './components/Vouchers/VoucherWindowModal';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Voucher, VoucherType } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, canAccessVoucher, hasPermission } = useAuth();
  const { vouchers } = useAccounting();

  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<Voucher | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createVoucherType, setCreateVoucherType] = useState<VoucherType>('CREDIT');
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Check URL hash for direct voucher links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#voucher-')) {
        const voucherId = hash.replace('#voucher-', '');
        const found = vouchers.find((v) => v.id === voucherId || v.voucherNumber === voucherId);
        if (found) {
          setSelectedVoucherForView(found);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [vouchers]);

  const handleOpenCreateVoucher = (type: VoucherType) => {
    setEditingVoucher(null);
    setCreateVoucherType(type);
    setIsCreateModalOpen(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setCreateVoucherType(voucher.type);
    setIsCreateModalOpen(true);
  };

  const handleOpenViewVoucher = (voucher: Voucher) => {
    setSelectedVoucherForView(voucher);
  };

  // Render current tab view
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return (
          <Dashboard
            onOpenCreateVoucher={handleOpenCreateVoucher}
            onOpenViewVoucher={handleOpenViewVoucher}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );

      case 'CREDIT_VOUCHERS':
        return (
          <VouchersList
            voucherTypeFilter="CREDIT"
            onOpenView={handleOpenViewVoucher}
            onOpenCreate={handleOpenCreateVoucher}
            onEdit={handleEditVoucher}
          />
        );

      case 'DEBIT_VOUCHERS':
        return (
          <VouchersList
            voucherTypeFilter="DEBIT"
            onOpenView={handleOpenViewVoucher}
            onOpenCreate={handleOpenCreateVoucher}
            onEdit={handleEditVoucher}
          />
        );

      case 'CONTRA_VOUCHERS':
        return (
          <VouchersList
            voucherTypeFilter="CONTRA"
            onOpenView={handleOpenViewVoucher}
            onOpenCreate={handleOpenCreateVoucher}
            onEdit={handleEditVoucher}
          />
        );

      case 'JOURNAL_VOUCHERS':
        return (
          <VouchersList
            voucherTypeFilter="JOURNAL"
            onOpenView={handleOpenViewVoucher}
            onOpenCreate={handleOpenCreateVoucher}
            onEdit={handleEditVoucher}
          />
        );

      case 'ALL_VOUCHERS':
        return (
          <VouchersList
            voucherTypeFilter="ALL"
            onOpenView={handleOpenViewVoucher}
            onOpenCreate={handleOpenCreateVoucher}
            onEdit={handleEditVoucher}
          />
        );

      case 'DAY_BOOK':
        return <DayBook onOpenViewVoucher={handleOpenViewVoucher} />;

      case 'CASH_BANK_BOOK':
        return <CashBankBook onOpenViewVoucher={handleOpenViewVoucher} />;

      case 'PARTY_STATEMENT':
        return <PartyStatement onOpenViewVoucher={handleOpenViewVoucher} />;

      case 'FINANCIAL_REPORTS':
        return <FinancialReports />;

      case 'GENERAL_LEDGER':
        return <GeneralLedger onOpenViewVoucher={handleOpenViewVoucher} />;

      case 'CHART_OF_ACCOUNTS':
        return <ChartOfAccounts />;

      case 'USER_MANAGEMENT':
        return <UserManagement />;

      case 'AUDIT_LOGS':
        return <AuditLogs />;

      case 'SUPABASE_SYNC':
        return <SupabaseSettings />;

      case 'SETTINGS':
        return <CompanySettingsView />;

      default:
        return (
          <Dashboard
            onOpenCreateVoucher={handleOpenCreateVoucher}
            onOpenViewVoucher={handleOpenViewVoucher}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f5] flex flex-col font-sans antialiased selection:bg-[#d4af37] selection:text-black">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateVoucher={handleOpenCreateVoucher}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Workspace with Sidebar and Content View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderCurrentView()}
        </main>
      </div>

      {/* Modal Dialogs */}
      {/* 1. Dedicated Voucher Window Modal (Separate window popout, PDF download, print) */}
      <VoucherWindowModal
        voucher={selectedVoucherForView}
        onClose={() => setSelectedVoucherForView(null)}
        onEdit={handleEditVoucher}
      />

      {/* 2. Voucher Creation & Edit Modal */}
      <VoucherFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingVoucher(null);
        }}
        initialType={createVoucherType}
        editingVoucher={editingVoucher}
      />

      {/* 3. Authentication & Operator Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccountingProvider>
        <MainAppContent />
      </AccountingProvider>
    </AuthProvider>
  );
}
