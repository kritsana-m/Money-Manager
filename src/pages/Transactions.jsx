import { useState } from 'react'
import { useTransactions } from '../db/useTransactions'
import { getNextMonth, getPrevMonth, getDayLabel } from '../utils/dates'
import MonthNavigator from '../components/MonthNavigator'
import SummaryCards from '../components/SummaryCards'
import ExpenseChart from '../components/ExpenseChart'
import CategoryBreakdown from '../components/CategoryBreakdown'
import TransactionItem from '../components/TransactionItem'
import TransactionForm from '../components/TransactionForm'
import BottomSheet from '../components/BottomSheet'
import FAB from '../components/FAB'
import { Receipt } from 'lucide-react'
import './Transactions.css'

export default function Transactions() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState('list') // 'list' | 'summary'
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    summary,
    groupedByDate,
    categoryBreakdown,
    dailyTotals
  } = useTransactions(currentMonth)

  const handlePrevMonth = () => setCurrentMonth(prev => getPrevMonth(prev))
  const handleNextMonth = () => setCurrentMonth(prev => getNextMonth(prev))

  const handleAdd = () => {
    setEditingTransaction(null)
    setSheetOpen(true)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setSheetOpen(true)
  }

  const handleSubmit = async (data) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data)
    } else {
      await addTransaction(data)
    }
    setSheetOpen(false)
    setEditingTransaction(null)
  }

  const handleDelete = async (id) => {
    await deleteTransaction(id)
  }

  const handleCloseSheet = () => {
    setSheetOpen(false)
    setEditingTransaction(null)
  }

  // Sorted date keys for the list view
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
      </div>

      <MonthNavigator
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* View Toggle */}
      <div className="segmented-control" style={{ marginBottom: 20 }}>
        <button
          className={`segmented-control-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          Daily
        </button>
        <button
          className={`segmented-control-btn ${view === 'summary' ? 'active' : ''}`}
          onClick={() => setView('summary')}
        >
          Summary
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      ) : view === 'summary' ? (
        /* ============ SUMMARY VIEW ============ */
        <div className="transactions-summary">
          <SummaryCards
            income={summary.totalIncome}
            expense={summary.totalExpense}
            net={summary.net}
          />

          <div className="section" style={{ marginTop: 24 }}>
            <h3 className="section-title">Income vs Expenses</h3>
            <div className="card">
              <ExpenseChart data={dailyTotals} />
            </div>
          </div>

          <div className="section">
            <h3 className="section-title">Spending by Category</h3>
            <div className="card">
              <CategoryBreakdown data={categoryBreakdown} />
            </div>
          </div>
        </div>
      ) : (
        /* ============ LIST VIEW ============ */
        <div className="transactions-list">
          <SummaryCards
            income={summary.totalIncome}
            expense={summary.totalExpense}
            net={summary.net}
          />

          {dateKeys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Receipt size={24} />
              </div>
              <p className="empty-state-title">No transactions yet</p>
              <p className="empty-state-text">
                Tap the + button to add your first transaction for this month
              </p>
            </div>
          ) : (
            <div className="date-groups" style={{ marginTop: 20 }}>
              {dateKeys.map(dateKey => {
                const group = groupedByDate[dateKey]
                const dayNet = group.income - group.expense
                return (
                  <div key={dateKey} className="date-group">
                    <div className="date-group-header">
                      <span className="date-group-label">
                        {getDayLabel(new Date(group.date + 'T00:00:00'))}
                      </span>
                      <span className={`date-group-total ${dayNet >= 0 ? 'positive' : 'negative'}`}>
                        {dayNet >= 0 ? '+' : '-'}฿{Math.abs(dayNet).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="date-group-items">
                      {group.transactions.map(t => (
                        <TransactionItem
                          key={t.id}
                          transaction={t}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <FAB onClick={handleAdd} label="Add transaction" />

      <BottomSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
      >
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseSheet}
          initialData={editingTransaction}
        />
      </BottomSheet>
    </div>
  )
}
