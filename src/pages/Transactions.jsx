import { useState, useMemo, useRef } from 'react'
import { useTransactions } from '../db/useTransactions'
import { getDB } from '../db/database'
import { parseTransactionFile, dedupeTransactions, summarizeImport } from '../utils/importTransactions'
import { getNextMonth, getPrevMonth, getDayLabel } from '../utils/dates'
import MonthNavigator from '../components/MonthNavigator'
import SummaryCards from '../components/SummaryCards'
import ExpenseChart from '../components/ExpenseChart'
import CategoryBreakdown from '../components/CategoryBreakdown'
import TransactionCalendar from '../components/TransactionCalendar'
import DayDetailSheet from '../components/DayDetailSheet'
import TransactionItem from '../components/TransactionItem'
import TransactionForm from '../components/TransactionForm'
import TransactionImport from '../components/TransactionImport'
import BottomSheet from '../components/BottomSheet'
import FAB from '../components/FAB'
import { Receipt, Upload } from 'lucide-react'
import './Transactions.css'

export default function Transactions() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState('list') // 'list' | 'summary'
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [selectedDateKey, setSelectedDateKey] = useState(null)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [importFileName, setImportFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTransactionsBulk,
    summary,
    groupedByDate,
    categoryBreakdown,
    dailyTotals
  } = useTransactions(currentMonth)

  // Daily summaries keyed by local calendar date (YYYY-MM-DD)
  const dailyByDate = useMemo(() => new Map(Object.entries(groupedByDate)), [groupedByDate])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => getPrevMonth(prev))
    setSelectedDateKey(null)
  }
  const handleNextMonth = () => {
    setCurrentMonth(prev => getNextMonth(prev))
    setSelectedDateKey(null)
  }

  const handleViewToggle = (nextView) => {
    setView(nextView)
    setSelectedDateKey(null)
  }

  const handleSelectDay = (dateKey) => setSelectedDateKey(dateKey)

  const handleCloseDayDetail = () => setSelectedDateKey(null)

  const handleEditFromDayDetail = (transaction) => {
    setSelectedDateKey(null)
    setEditingTransaction(transaction)
    setSheetOpen(true)
  }

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
    setSheetOpen(false)
    setEditingTransaction(null)
  }

  const handleCloseSheet = () => {
    setSheetOpen(false)
    setEditingTransaction(null)
  }

  const handleImportClick = () => {
    setImportError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const { transactions: parsed, errors } = parseTransactionFile(text)
      const db = await getDB()
      const existing = await db.getAll('transactions')
      const { items, duplicates } = dedupeTransactions(parsed, existing)
      setImportPreview({ items, duplicates, errors, summary: summarizeImport(items) })
      setImportFileName(file.name)
      setImportSheetOpen(true)
    } catch (err) {
      setImportError('Could not read file: ' + (err.message || 'unknown error'))
    }
  }

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.items.length === 0) return
    setImporting(true)
    try {
      await addTransactionsBulk(importPreview.items)
      setImportSheetOpen(false)
      setImportPreview(null)
    } catch (err) {
      setImportError('Import failed: ' + (err.message || 'unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const handleCloseImport = () => {
    setImportSheetOpen(false)
    setImportPreview(null)
  }

  // Sorted date keys for the list view
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <div className="page-header tx-header">
        <h1 className="page-title">Transactions</h1>
        <button className="tx-import-btn" onClick={handleImportClick} aria-label="Import transactions from .txt file">
          <Upload size={16} />
          <span>Import</span>
        </button>
      </div>
      <input
        type="file"
        accept=".txt,text/plain"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {importError && (
        <div className="tx-import-page-error">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <MonthNavigator
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* View Toggle */}
      <div className="segmented-control" style={{ marginBottom: 20 }}>
        <button
          className={`segmented-control-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => handleViewToggle('list')}
        >
          Daily
        </button>
        <button
          className={`segmented-control-btn ${view === 'summary' ? 'active' : ''}`}
          onClick={() => handleViewToggle('summary')}
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
            <TransactionCalendar
              currentMonth={currentMonth}
              dailyByDate={dailyByDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              selectedDateKey={selectedDateKey}
              onSelectDay={handleSelectDay}
            />
          </div>

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
          onDelete={handleDelete}
          initialData={editingTransaction}
        />
      </BottomSheet>

      <DayDetailSheet
        isOpen={!sheetOpen && !!selectedDateKey}
        onClose={handleCloseDayDetail}
        dateKey={selectedDateKey}
        dayData={selectedDateKey ? groupedByDate[selectedDateKey] : null}
        onEdit={handleEditFromDayDetail}
        onDelete={handleDelete}
      />

      <BottomSheet
        isOpen={importSheetOpen}
        onClose={handleCloseImport}
        title="Import Transactions"
      >
        {importPreview && (
          <TransactionImport
            fileName={importFileName}
            preview={importPreview}
            importing={importing}
            onConfirm={handleConfirmImport}
            onCancel={handleCloseImport}
          />
        )}
      </BottomSheet>
    </div>
  )
}
