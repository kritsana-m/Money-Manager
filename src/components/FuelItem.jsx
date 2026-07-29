import { Fuel, Gauge } from 'lucide-react'
import { formatDate, parseDate } from '../utils/dates'
import './FuelItem.css'

export default function FuelItem({ record, onEdit, onDelete }) {
  const handleLongPress = () => {
    if (window.confirm('Delete this fuel record?')) {
      onDelete(record.id)
    }
  }

  return (
    <div
      className="fuel-item"
      onClick={() => onEdit(record)}
      onContextMenu={(e) => {
        e.preventDefault()
        handleLongPress()
      }}
    >
      <div className="fuel-item-icon">
        <Fuel size={18} />
      </div>
      <div className="fuel-item-info">
        <div className="fuel-item-header">
          <span className="fuel-item-date">
            {formatDate(parseDate(record.date), 'd MMM yyyy')}
          </span>
          <span className="fuel-item-odometer">
            {record.odometer?.toLocaleString('th-TH')} km
          </span>
        </div>
        <div className="fuel-item-details">
          <span className="fuel-item-liters">
            {record.liters.toFixed(2)} L
          </span>
          <span className="fuel-item-sep">&times;</span>
          <span className="fuel-item-price">
            ฿{record.pricePerLiter.toFixed(2)}/L
          </span>
          <span className="fuel-item-sep">=</span>
          <span className="fuel-item-cost">
            ฿{record.cost.toLocaleString('th-TH')}
          </span>
        </div>
        {record.kmPerLiter != null && (
          <div className="fuel-item-efficiency">
            <Gauge size={14} className="fuel-item-gauge" />
            <span className={`fuel-item-kml ${record.kmPerLiter >= 10 ? 'good' : record.kmPerLiter >= 7 ? 'ok' : 'low'}`}>
              {record.kmPerLiter.toFixed(1)} km/L
            </span>
            <span className="fuel-item-km-driven">
              &middot; {record.kmDriven.toLocaleString('th-TH')} km driven
            </span>
          </div>
        )}
        {record.kmPerLiter == null && (
          <div className="fuel-item-efficiency fuel-item-no-data">
            No previous data for efficiency
          </div>
        )}
        {record.note && (
          <div className="fuel-item-note">{record.note}</div>
        )}
      </div>
    </div>
  )
}
