import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import './SummaryCards.css'

export default function SummaryCards({ income, expense, net }) {
  return (
    <div className="summary-cards">
      <div className="summary-card income">
        <div className="summary-card-icon">
          <TrendingUp size={18} />
        </div>
        <div className="summary-card-info">
          <span className="summary-card-label">Income</span>
          <span className="summary-card-value">{formatCurrency(income)}</span>
        </div>
      </div>
      <div className="summary-card expense">
        <div className="summary-card-icon">
          <TrendingDown size={18} />
        </div>
        <div className="summary-card-info">
          <span className="summary-card-label">Expenses</span>
          <span className="summary-card-value">{formatCurrency(expense)}</span>
        </div>
      </div>
      <div className={`summary-card net ${net >= 0 ? 'positive' : 'negative'}`}>
        <div className="summary-card-icon">
          <Wallet size={18} />
        </div>
        <div className="summary-card-info">
          <span className="summary-card-label">Balance</span>
          <span className="summary-card-value">{formatCurrency(Math.abs(net))}</span>
        </div>
      </div>
    </div>
  )
}
