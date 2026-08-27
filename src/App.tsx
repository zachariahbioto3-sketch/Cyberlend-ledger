import React, { useState, useEffect } from 'react';
import { useLoanStore } from './store/loanStore';
import { sampleLoans } from './data/sampleLoans';
import { Loan } from './types';
import {
  Navbar,
  PortfolioOverview,
  LoanLedgerTable,
  NewLoanModal,
  RecordPaymentModal,
} from './components';

function App() {
  const { loans, setLoans, addLoan, recordPayment, deleteLoan, metrics } = useLoanStore();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [newLoanModalOpen, setNewLoanModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);

  // Load sample data on first render
  useEffect(() => {
    if (loans.length === 0) {
      setLoans(sampleLoans);
    }
  }, []);

  const handleRecordPayment = (loan: Loan) => {
    setPaymentLoan(loan);
    setRecordPaymentModalOpen(true);
  };

  const handleSavePayment = (loanId: string, transaction: any) => {
    recordPayment(loanId, transaction);
    setRecordPaymentModalOpen(false);
    setPaymentLoan(null);
    alert('Payment recorded successfully!');
  };

  const handleAddLoan = (loanData: any) => {
    addLoan(loanData);
    setNewLoanModalOpen(false);
    alert('Loan originated successfully!');
  };

  const handleExportCSV = () => {
    if (loans.length === 0) {
      alert('No loans to export');
      return;
    }

    const headers = [
      'Loan #',
      'Borrower',
      'Phone',
      'Principal',
      'Interest',
      'Total Repayable',
      'Monthly Payment',
      'Status',
      'Origination Date',
      'Maturity Date',
      'Amount Paid',
      'Remaining Balance',
      'Months Remaining',
    ];

    const rows = loans.map((loan) => [
      loan.loanNumber,
      loan.borrowerName,
      loan.borrowerPhone,
      loan.loanAmount,
      loan.interestAmount,
      loan.totalRepayable,
      loan.monthlyPayment,
      loan.status,
      loan.originationDate,
      loan.maturityDate,
      loan.amountPaid,
      loan.remainingBalance,
      loan.monthsRemaining,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberlend-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar
        metrics={metrics}
        onOpenNewLoanModal={() => setNewLoanModalOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <PortfolioOverview
          metrics={metrics}
          loans={loans}
          onSelectLoan={setSelectedLoan}
        />

        {/* Loan Ledger Table */}
        <div className="mt-8">
          <LoanLedgerTable
            loans={loans}
            onSelectLoan={setSelectedLoan}
            onRecordPayment={handleRecordPayment}
            onDeleteLoan={deleteLoan}
            onOpenNewLoan={() => setNewLoanModalOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <NewLoanModal
        isOpen={newLoanModalOpen}
        onClose={() => setNewLoanModalOpen(false)}
        onAddLoan={handleAddLoan}
      />

      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        loan={paymentLoan}
        onClose={() => {
          setRecordPaymentModalOpen(false);
          setPaymentLoan(null);
        }}
        onSavePayment={handleSavePayment}
      />

      {/* Loan Detail Modal (Coming Soon) */}
      {selectedLoan && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedLoan(null)} />
      )}
    </div>
  );
}

export default App;
