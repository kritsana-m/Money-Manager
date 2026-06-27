import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthLabel } from '../utils/dates'
import './MonthNavigator.css'

export default function MonthNavigator({ currentMonth, onPrev, onNext }) {
  return (
    <div className="month-navigator">
      <button className="month-nav-btn" onClick={onPrev} aria-label="Previous month">
        <ChevronLeft size={20} />
      </button>
      <span className="month-nav-label">{getMonthLabel(currentMonth)}</span>
      <button className="month-nav-btn" onClick={onNext} aria-label="Next month">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
