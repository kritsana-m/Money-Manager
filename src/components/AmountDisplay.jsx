import { formatCurrency } from '../utils/currency'

export default function AmountDisplay({ amount, type, size = 'md', showSign = false }) {
  return (
    <span className="amount-display" style={{
      color: type === 'income' ? 'var(--color-income)' : type === 'expense' ? 'var(--color-expense)' : 'var(--color-text)',
      fontWeight: size === 'lg' ? 700 : size === 'md' ? 600 : 500,
      fontSize: size === 'lg' ? '24px' : size === 'md' ? '16px' : '14px',
      fontVariantNumeric: 'tabular-nums'
    }}>
      {type === 'income' && showSign ? '+' : type === 'expense' && showSign ? '-' : ''}
      {formatCurrency(Math.abs(amount))}
    </span>
  )
}
