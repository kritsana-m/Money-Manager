import CategoryIcon from './CategoryIcon'
import AmountDisplay from './AmountDisplay'
import { Check, Calendar } from 'lucide-react'
import './SubscriptionCard.css'

export default function SubscriptionCard({ subscription, onTogglePaid, onEdit, onDelete }) {
  const handleCheckboxClick = (e) => {
    e.stopPropagation()
    onTogglePaid(subscription.id)
  }

  const handleEditClick = () => {
    onEdit(subscription)
  }

  return (
    <div
      className={`subscription-card ${subscription.isPaid ? 'paid' : 'unpaid'}`}
      onClick={handleEditClick}
    >
      <div className="sub-card-left">
        <CategoryIcon categoryId={subscription.category} type="subscription" size={20} />
        <div className="sub-card-info">
          <span className="sub-card-name">
            {subscription.name}
            {subscription.periodInfo?.isLastPayment && (
              <span className="last-payment-badge">Last payment</span>
            )}
          </span>
          <span className="sub-card-due">
            <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'text-bottom' }} />
            Due: Day {subscription.dueDay} ({subscription.cycle})
          </span>
          {subscription.periodInfo && (
            <div className="sub-card-progress-container">
              <div className="sub-card-progress-bar-bg">
                <div
                  className="sub-card-progress-bar-fill"
                  style={{ width: `${(subscription.periodInfo.currentMonth / subscription.periodInfo.totalMonths) * 100}%` }}
                />
              </div>
              <span className="sub-card-progress-text">
                Month {subscription.periodInfo.currentMonth} of {subscription.periodInfo.totalMonths}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="sub-card-right">
        <div className="sub-card-price">
          <AmountDisplay amount={subscription.amount} size="sm" />
        </div>
        <button
          className={`sub-checkbox ${subscription.isPaid ? 'checked' : ''}`}
          onClick={handleCheckboxClick}
          aria-label={subscription.isPaid ? "Mark as unpaid" : "Mark as paid"}
        >
          {subscription.isPaid && <Check size={14} strokeWidth={3} />}
        </button>
      </div>
    </div>
  )
}
