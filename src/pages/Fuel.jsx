import { useState } from 'react'
import { useFuelRecords } from '../db/useFuelRecords'
import { getNextMonth, getPrevMonth } from '../utils/dates'
import MonthNavigator from '../components/MonthNavigator'
import FuelItem from '../components/FuelItem'
import FuelForm from '../components/FuelForm'
import BottomSheet from '../components/BottomSheet'
import FAB from '../components/FAB'
import { Fuel, Gauge, TrendingDown, DollarSign } from 'lucide-react'
import './Fuel.css'

export default function FuelPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState('list')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const { records, loading, addRecord, updateRecord, deleteRecord, monthlySummary } = useFuelRecords(currentMonth)

  const handlePrevMonth = () => setCurrentMonth(prev => getPrevMonth(prev))
  const handleNextMonth = () => setCurrentMonth(prev => getNextMonth(prev))

  const handleAdd = () => { setEditingRecord(null); setSheetOpen(true) }
  const handleEdit = (record) => { setEditingRecord(record); setSheetOpen(true) }

  const handleSubmit = async (data) => {
    if (editingRecord) { await updateRecord(editingRecord.id, data) }
    else { await addRecord(data) }
    setSheetOpen(false); setEditingRecord(null)
  }

  const handleDelete = async (id) => {
    await deleteRecord(id); setSheetOpen(false); setEditingRecord(null)
  }

  const handleCloseSheet = () => { setSheetOpen(false); setEditingRecord(null) }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fuel Tracker</h1>
      </div>

      <MonthNavigator currentMonth={currentMonth} onPrev={handlePrevMonth} onNext={handleNextMonth} />

      <div className="segmented-control" style={{ marginBottom: 20 }}>
        <button className={`segmented-control-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => setView('list')}>Records</button>
        <button className={`segmented-control-btn ${view === 'summary' ? 'active' : ''}`}
                onClick={() => setView('summary')}>Summary</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="loading-spinner" /></div>
      ) : view === 'summary' ? (
        <div className="fuel-summary">
          <div className="fuel-summary-cards">
            <div className="fuel-summary-card">
              <div className="fuel-summary-card-icon" style={{ background: 'var(--color-accent-lighter)', color: 'var(--color-accent)' }}>
                <DollarSign size={20} />
              </div>
              <div className="fuel-summary-card-info">
                <span className="fuel-summary-card-label">Total Cost</span>
                <span className="fuel-summary-card-value">฿{monthlySummary.totalCost.toLocaleString('th-TH')}</span>
              </div>
            </div>
            <div className="fuel-summary-card">
              <div className="fuel-summary-card-icon" style={{ background: 'rgba(123,160,126,0.12)', color: 'var(--color-income)' }}>
                <Fuel size={20} />
              </div>
              <div className="fuel-summary-card-info">
                <span className="fuel-summary-card-label">Total Liters</span>
                <span className="fuel-summary-card-value">{monthlySummary.totalLiters.toFixed(2)} L</span>
              </div>
            </div>
            <div className="fuel-summary-card">
              <div className="fuel-summary-card-icon" style={{ background: 'rgba(212,168,83,0.12)', color: 'var(--color-warning)' }}>
                <TrendingDown size={20} />
              </div>
              <div className="fuel-summary-card-info">
                <span className="fuel-summary-card-label">KM Driven</span>
                <span className="fuel-summary-card-value">{monthlySummary.totalKmDriven.toLocaleString('th-TH')} km</span>
              </div>
            </div>
            <div className="fuel-summary-card">
              <div className="fuel-summary-card-icon" style={{ background: 'rgba(196,120,91,0.12)', color: 'var(--color-accent)' }}>
                <Gauge size={20} />
              </div>
              <div className="fuel-summary-card-info">
                <span className="fuel-summary-card-label">Avg Efficiency</span>
                <span className="fuel-summary-card-value">
                  {monthlySummary.avgKmPerLiter != null
                    ? `${monthlySummary.avgKmPerLiter.toFixed(1)} km/L`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="section" style={{ marginTop: 24 }}>
            <h3 className="section-title">Fuel Efficiency Details</h3>
            <div className="card">
              <div className="fuel-summary-detail">
                <div className="fuel-detail-row">
                  <span className="fuel-detail-label">Records this month</span>
                  <span className="fuel-detail-value">{monthlySummary.totalRecords}</span>
                </div>
                <div className="fuel-detail-row">
                  <span className="fuel-detail-label">Avg cost per liter</span>
                  <span className="fuel-detail-value">
                    {monthlySummary.avgCostPerLiter != null
                      ? `฿${monthlySummary.avgCostPerLiter.toFixed(2)}/L`
                      : '—'}
                  </span>
                </div>
                <div className="fuel-detail-row">
                  <span className="fuel-detail-label">Avg cost per km</span>
                  <span className="fuel-detail-value">
                    {monthlySummary.avgKmPerLiter != null && monthlySummary.avgCostPerLiter != null
                      ? `฿${(monthlySummary.avgCostPerLiter / monthlySummary.avgKmPerLiter).toFixed(2)}/km`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {records.length > 0 && (
            <div className="section">
              <h3 className="section-title">This Month's Records</h3>
              <div className="card fuel-list-card">
                {records.map(r => (
                  <FuelItem key={r.id} record={r} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="fuel-list">
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Fuel size={24} /></div>
              <p className="empty-state-title">No fuel records yet</p>
              <p className="empty-state-text">Tap the + button to log your first fill-up for this month</p>
            </div>
          ) : (
            <div className="card fuel-list-card">
              {records.map(r => (
                <FuelItem key={r.id} record={r} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      <FAB onClick={handleAdd} label="Add fuel record" />

      <BottomSheet isOpen={sheetOpen} onClose={handleCloseSheet}
                   title={editingRecord ? 'Edit Fuel Record' : 'New Fuel Record'}>
        <FuelForm onSubmit={handleSubmit} onCancel={handleCloseSheet}
                   onDelete={handleDelete} initialData={editingRecord} />
      </BottomSheet>
    </div>
  )
}
