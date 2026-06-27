import CategoryIcon from './CategoryIcon'
import AmountDisplay from './AmountDisplay'
import { getCategoryById } from '../utils/categories'
import './TransactionItem.css'

export default function TransactionItem({ transaction, onEdit, onDelete }) {
  const category = getCategoryById(transaction.category)

  const handleLongPress = () => {
    if (window.confirm('Delete this transaction?')) {
      onDelete(transaction.id)
    }
  }

  return (
    <div
      className="transaction-item"
      onClick={() => onEdit(transaction)}
      onContextMenu={(e) => {
        e.preventDefault()
        handleLongPress()
      }}
    >
      <CategoryIcon categoryId={transaction.category} size={18} />
      <div className="transaction-item-info">
        <span className="transaction-item-category">{category.name}</span>
        {transaction.note && (
          <span className="transaction-item-note">{transaction.note}</span>
        )}
      </div>
      <AmountDisplay
        amount={transaction.amount}
        type={transaction.type}
        size="sm"
        showSign
      />
    </div>
  )
}
