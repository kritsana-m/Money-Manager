import { useState } from 'react'
import { useSubscriptions } from '../db/useSubscriptions'
import { getNextMonth, getPrevMonth, getMonthKey } from '../utils/dates'
import MonthNavigator from '../components/MonthNavigator'
import AmountDisplay from '../components/AmountDisplay'
import SubscriptionCard from '../components/SubscriptionCard'
import SubscriptionForm from '../components/SubscriptionForm'
import BottomSheet from '../components/BottomSheet'
import FAB from '../components/FAB'
import { CheckCircle2 } from 'lucide-react'
import './Subscriptions.css'

export default function Subscriptions() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSub, setEditingSub] = useState(null)

  const {
    subscriptions,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    togglePaid,
    summary
  } = useSubscriptions(currentMonth)

  const handlePrevMonth = () => setCurrentMonth(prev => getPrevMonth(prev))
  const handleNextMonth = () => setCurrentMonth(prev => getNextMonth(prev))

  const handleAdd = () => {
    setEditingSub(null)
    setSheetOpen(true)
  }

  const handleEdit = (sub) => {
    setEditingSub(sub)
    setSheetOpen(true)
  }

  const handleSubmit = async (data) => {
    if (editingSub) {
      await updateSubscription(editingSub.id, data)
    } else {
      await addSubscription(data)
    }
    setSheetOpen(false)
    setEditingSub(null)
  }

  const handleDelete = async (id) => {
    await deleteSubscription(id)
    setSheetOpen(false)
    setEditingSub(null)
  }

  const handleCloseSheet = () => {
    setSheetOpen(false)
    setEditingSub(null)
  }

  // Sort: unpaid first, then by due day
  const sortedSubs = [...subscriptions].sort((a, b) => {
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? 1 : -1
    }
    return a.dueDay - b.dueDay
  })

  // Calculate percentage of paid subscriptions
  const paidPercent = summary.totalCost > 0
    ? (summary.totalPaid / summary.totalCost) * 100
    : 0

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Subscriptions</h1>
      </div>

      <MonthNavigator
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="subscriptions-content">
          {/* Subscription Summary */}
          <div className="card subscription-summary-card" style={{ marginBottom: 24 }}>
            <div className="sub-summary-totals">
              <div className="sub-summary-item">
                <span className="sub-summary-label">Total Cost</span>
                <AmountDisplay amount={summary.totalCost} size="lg" />
              </div>
              <div className="sub-summary-split">
                <div className="sub-split-item paid-split">
                  <span className="split-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                  <span>Paid: </span>
                  <AmountDisplay amount={summary.totalPaid} size="sm" type="income" />
                </div>
                <div className="sub-split-item unpaid-split">
                  <span className="split-dot" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <span>Remaining: </span>
                  <AmountDisplay amount={summary.totalUnpaid} size="sm" type="expense" />
                </div>
              </div>
            </div>

            {summary.totalCost > 0 && (
              <div className="sub-progress-bar-wrapper">
                <div className="sub-progress-bar" style={{ width: `${paidPercent}%` }} />
                <span className="sub-progress-text">{Math.round(paidPercent)}% Paid</span>
              </div>
            )}
          </div>

          {/* List Section */}
          <div className="section">
            <h3 className="section-title">
              {summary.unpaidCount > 0
                ? `${summary.unpaidCount} Pending Payments`
                : 'All Caught Up!'}
            </h3>

            {sortedSubs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 size={24} />
                </div>
                <p className="empty-state-title">No subscriptions</p>
                <p className="empty-state-text">
                  Add subscriptions to track recurring costs and monthly payments.
                </p>
              </div>
            ) : (
              <div className="subscriptions-list-grid">
                {sortedSubs.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onTogglePaid={togglePaid}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FAB onClick={handleAdd} label="Add subscription" />

      <BottomSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        title={editingSub ? 'Edit Subscription' : 'New Subscription'}
      >
        <SubscriptionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseSheet}
          onDelete={handleDelete}
          initialData={editingSub}
          defaultStartMonth={getMonthKey(currentMonth)}
        />
      </BottomSheet>
    </div>
  )
}
