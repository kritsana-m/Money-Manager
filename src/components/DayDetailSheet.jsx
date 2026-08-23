import BottomSheet from './BottomSheet'
import TransactionItem from './TransactionItem'
import { formatCurrency } from '../utils/currency'
import { formatDate } from '../utils/dates'
import './DayDetailSheet.css'

export default function DayDetailSheet({ isOpen, onClose, dateKey, dayData, onEdit, onDelete }) {
  if (!dateKey || !dayData) return null

  const title = formatDate(new Date(`${dateKey}T00:00:00`), 'MMMM d, yyyy')
  const net = dayData.income - dayData.expense
  const incomes = dayData.transactions.filter(t => t.type === 'income')
  const expenses = dayData.transactions.filter(t => t.type === 'expense')

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="day-detail">
        {incomes.length > 0 && (
          <section className="day-detail-section">
            <header className="day-detail-section-header">
              <span className="day-detail-section-label">Income</span>
              <span className="day-detail-section-total income">
                +{formatCurrency(dayData.income)}
              </span>
            </header>
            <div className="day-detail-items">
              {incomes.map(t => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onEdit={(transaction) => onEdit(transaction)}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        )}

        {expenses.length > 0 && (
          <section className="day-detail-section">
            <header className="day-detail-section-header">
              <span className="day-detail-section-label">Expenses</span>
              <span className="day-detail-section-total expense">
                -{formatCurrency(dayData.expense)}
              </span>
            </header>
            <div className="day-detail-items">
              {expenses.map(t => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onEdit={(transaction) => onEdit(transaction)}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        )}

        <footer className="day-detail-net">
          <span className="day-detail-net-label">Net</span>
          <span className={`day-detail-net-value ${net >= 0 ? 'positive' : 'negative'}`}>
            {net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(net))}
          </span>
        </footer>
      </div>
    </BottomSheet>
  )
}
