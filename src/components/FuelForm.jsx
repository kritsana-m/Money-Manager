import { useState, useEffect } from 'react'
import { getDateKey } from '../utils/dates'
import './FuelForm.css'

export default function FuelForm({ onSubmit, onCancel, onDelete = null, initialData = null }) {
  const [date, setDate] = useState(initialData?.date || getDateKey(new Date()))
  const [odometer, setOdometer] = useState(initialData?.odometer?.toString() || '')
  const [liters, setLiters] = useState(initialData?.liters?.toString() || '')
  const [cost, setCost] = useState(initialData?.cost?.toString() || '')
  const [isFullTank, setIsFullTank] = useState(initialData?.isFullTank ?? true)
  const [note, setNote] = useState(initialData?.note || '')

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || getDateKey(new Date()))
      setOdometer(initialData.odometer?.toString() || '')
      setLiters(initialData.liters?.toString() || '')
      setCost(initialData.cost?.toString() || '')
      setIsFullTank(initialData.isFullTank ?? true)
      setNote(initialData.note || '')
    }
  }, [initialData])

  const pricePerLiter = liters && cost
    ? (parseFloat(cost) / parseFloat(liters)).toFixed(2)
    : '—'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!odometer || parseFloat(odometer) <= 0) return
    if (!liters || parseFloat(liters) <= 0) return
    if (!cost || parseFloat(cost) <= 0) return
    onSubmit({
      date,
      odometer: parseFloat(odometer),
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      isFullTank,
      note: note.trim()
    })
  }

  const handleDeleteClick = () => {
    if (initialData && onDelete && window.confirm('Delete this fuel record?')) {
      onDelete(initialData.id)
    }
  }

  return (
    <form className="fuel-form" onSubmit={handleSubmit}>
      <div className="fuel-form-row">
        <div className="form-field fuel-form-field fuel-form-date">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Odometer (km)</label>
        <input
          type="number"
          className="form-input fuel-input-lg"
          value={odometer}
          onChange={e => setOdometer(e.target.value)}
          placeholder="0"
          inputMode="numeric"
          min="0"
          autoFocus
          required
        />
      </div>

      <div className="fuel-form-row fuel-form-row-3">
        <div className="form-field fuel-form-field">
          <label className="form-label">Liters</label>
          <input
            type="number"
            className="form-input"
            value={liters}
            onChange={e => setLiters(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="form-field fuel-form-field">
          <label className="form-label">Cost (฿)</label>
          <input
            type="number"
            className="form-input"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="form-field fuel-form-field">
          <label className="form-label">฿/L</label>
          <div className="fuel-ppl-display">{pricePerLiter}</div>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label fill-type-label">
          <span>Fill Type</span>
        </label>
        <div className="fuel-tank-toggle">
          <button
            type="button"
            className={`fuel-tank-btn ${isFullTank ? 'active' : ''}`}
            onClick={() => setIsFullTank(true)}
          >
            Full Tank
          </button>
          <button
            type="button"
            className={`fuel-tank-btn ${!isFullTank ? 'active' : ''}`}
            onClick={() => setIsFullTank(false)}
          >
            Partial
          </button>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Note (optional)</label>
        <input
          type="text"
          className="form-input"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Gas station, brand, etc."
          maxLength={100}
        />
      </div>

      <div className="form-actions">
        {initialData && onDelete ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteClick}
            aria-label="Delete fuel record"
          >
            Delete
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Update' : 'Add'} Record
        </button>
      </div>
    </form>
  )
}
