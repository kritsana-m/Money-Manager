import { useState, useEffect } from 'react'
import { TRANSACTION_CATEGORIES } from '../utils/categories'
import CategoryIcon from './CategoryIcon'
import { getDateKey } from '../utils/dates'
import './TransactionForm.css'

export default function TransactionForm({ onSubmit, onCancel, initialData = null }) {
  const [type, setType] = useState(initialData?.type || 'expense')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || 'food')
  const [note, setNote] = useState(initialData?.note || '')
  const [date, setDate] = useState(initialData?.date || getDateKey(new Date()))

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense')
      setAmount(initialData.amount?.toString() || '')
      setCategory(initialData.category || 'food')
      setNote(initialData.note || '')
      setDate(initialData.date || getDateKey(new Date()))
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      note: note.trim(),
      date
    })
  }

  // Filter categories based on type
  const filteredCategories = type === 'income'
    ? TRANSACTION_CATEGORIES.filter(c => ['salary', 'freelance', 'gift', 'investment', 'other'].includes(c.id))
    : TRANSACTION_CATEGORIES.filter(c => !['salary', 'freelance', 'investment'].includes(c.id))

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {/* Type Toggle */}
      <div className="form-type-toggle">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => {
            setType('expense')
            setCategory('food') // reset default category for expense
          }}
        >
          Expense
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => {
            setType('income')
            setCategory('salary') // reset default category for income
          }}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <div className="form-field">
        <label className="form-label">Amount (฿)</label>
        <input
          type="number"
          className="form-input amount-input"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          step="0.01"
          min="0"
          autoFocus
          required
        />
      </div>

      {/* Category */}
      <div className="form-field">
        <label className="form-label">Category</label>
        <div className="category-grid">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`category-option ${category === cat.id ? 'selected' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <CategoryIcon categoryId={cat.id} size={18} />
              <span className="category-option-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="form-field">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      {/* Note */}
      <div className="form-field">
        <label className="form-label">Note (optional)</label>
        <input
          type="text"
          className="form-input"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          maxLength={100}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Update' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
        </button>
      </div>
    </form>
  )
}
