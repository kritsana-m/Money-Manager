import { useState, useEffect } from 'react'
import { SUBSCRIPTION_CATEGORIES } from '../utils/categories'
import CategoryIcon from './CategoryIcon'
import './SubscriptionForm.css'

export default function SubscriptionForm({ onSubmit, onCancel, onDelete = null, initialData = null, defaultStartMonth = '' }) {
  const [name, setName] = useState(initialData?.name || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [cycle, setCycle] = useState(initialData?.cycle || 'monthly')
  const [dueDay, setDueDay] = useState(initialData?.dueDay?.toString() || '1')
  const [category, setCategory] = useState(initialData?.category || 'streaming')
  const [periodMonths, setPeriodMonths] = useState(initialData?.periodMonths?.toString() || '')
  const [startMonth, setStartMonth] = useState(initialData?.startMonth || defaultStartMonth || '')

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setAmount(initialData.amount?.toString() || '')
      setCycle(initialData.cycle || 'monthly')
      setDueDay(initialData.dueDay?.toString() || '1')
      setCategory(initialData.category || 'streaming')
      setPeriodMonths(initialData.periodMonths?.toString() || '')
      setStartMonth(initialData.startMonth || defaultStartMonth || '')
    } else {
      setName('')
      setAmount('')
      setCycle('monthly')
      setDueDay('1')
      setCategory('streaming')
      setPeriodMonths('')
      setStartMonth(defaultStartMonth || '')
    }
  }, [initialData, defaultStartMonth])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return
    
    let parsedDay = parseInt(dueDay)
    if (isNaN(parsedDay) || parsedDay < 1) parsedDay = 1
    if (parsedDay > 31) parsedDay = 31

    const parsedPeriod = periodMonths.trim() !== '' ? parseInt(periodMonths, 10) : null

    onSubmit({
      name: name.trim(),
      amount: parseFloat(amount),
      cycle,
      dueDay: parsedDay,
      category,
      startMonth: startMonth || defaultStartMonth,
      periodMonths: parsedPeriod
    })
  }

  const handleDeleteClick = () => {
    if (initialData && onDelete && window.confirm(`Delete subscription "${initialData.name}"?`)) {
      onDelete(initialData.id)
    }
  }

  // Pre-fill quick service names when categories change
  const handleCategoryChange = (catId) => {
    setCategory(catId)
    // Optional: Pre-fill service name if empty
    if (!name.trim()) {
      if (catId === 'streaming') setName('Netflix')
      else if (catId === 'music') setName('Spotify')
      else if (catId === 'fitness') setName('Gym Membership')
      else if (catId === 'cloud') setName('iCloud')
    }
  }

  return (
    <form className="subscription-form" onSubmit={handleSubmit}>
      {/* Name */}
      <div className="form-field">
        <label className="form-label">Service Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Netflix, Spotify, Gym"
          maxLength={50}
          required
        />
      </div>

      {/* Amount */}
      <div className="form-field">
        <label className="form-label">Monthly Cost (฿)</label>
        <input
          type="number"
          className="form-input amount-input"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
        />
      </div>

      {/* Billing Cycle */}
      <div className="form-field">
        <label className="form-label">Billing Cycle</label>
        <div className="cycle-toggle">
          <button
            type="button"
            className={`cycle-btn ${cycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setCycle('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`cycle-btn ${cycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setCycle('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Due Day */}
      <div className="form-field">
        <label className="form-label">Due Day of Month (1 - 31)</label>
        <input
          type="number"
          className="form-input"
          value={dueDay}
          onChange={e => setDueDay(e.target.value)}
          min="1"
          max="31"
          required
        />
      </div>

      {/* Start Month */}
      <div className="form-field">
        <label className="form-label">Start Month</label>
        <input
          type="month"
          className="form-input"
          value={startMonth}
          onChange={e => setStartMonth(e.target.value)}
          required
        />
      </div>

      {/* Period (Duration) */}
      <div className="form-field">
        <label className="form-label">Duration (Months) - Optional</label>
        <input
          type="number"
          className="form-input"
          value={periodMonths}
          onChange={e => setPeriodMonths(e.target.value)}
          placeholder="Ongoing / Indefinite"
          min="1"
          step="1"
        />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Leave empty for ongoing subscription, or set a number of months for installments.
        </span>
      </div>

      {/* Category */}
      <div className="form-field">
        <label className="form-label">Category</label>
        <div className="category-grid">
          {SUBSCRIPTION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`category-option ${category === cat.id ? 'selected' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <CategoryIcon categoryId={cat.id} type="subscription" size={18} />
              <span className="category-option-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        {initialData && onDelete ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteClick}
            aria-label="Delete subscription"
          >
            Delete
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Save Changes' : 'Add Subscription'}
        </button>
      </div>
    </form>
  )
}
