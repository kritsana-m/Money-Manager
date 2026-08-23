import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, startOfMonth, startOfWeek, format, isSameMonth, isToday } from 'date-fns'
import { getDateKey, getMonthKey, getMonthLabel } from '../utils/dates'
import { formatCurrency } from '../utils/currency'
import './TransactionCalendar.css'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildCalendarCells(month) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(first, i)
    return {
      key: getDateKey(date),
      dayNumber: format(date, 'd'),
      monthLabel: format(date, 'MMMM d'),
      inMonth: isSameMonth(date, month),
      isToday: isToday(date)
    }
  })
}

export default function TransactionCalendar({
  currentMonth,
  dailyByDate,
  onPrevMonth,
  onNextMonth,
  selectedDateKey,
  onSelectDay
}) {
  const cells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth])
  const isEmptyMonth = dailyByDate.size === 0

  const renderCell = (cell) => {
    const summary = dailyByDate.get(cell.key)
    const hasActivity = !!summary && (summary.income > 0 || summary.expense > 0)
    const isSelected = selectedDateKey === cell.key

    const classes = [
      'calendar-day',
      !cell.inMonth && 'outside-month',
      cell.isToday && 'today',
      hasActivity && 'has-activity',
      isSelected && 'selected'
    ].filter(Boolean).join(' ')

    let ariaLabel = cell.monthLabel
    if (hasActivity) {
      if (summary.income > 0) ariaLabel += `, income ${formatCurrency(summary.income)}`
      if (summary.expense > 0) ariaLabel += `, expenses ${formatCurrency(summary.expense)}`
    } else {
      ariaLabel += ', no transactions'
    }

    const content = (
      <>
        <span className="calendar-day-number" aria-hidden="true">{cell.dayNumber}</span>
        {hasActivity && (
          <span className="calendar-day-amounts" aria-hidden="true">
            {summary.income > 0 && (
              <span className="calendar-day-income">
                {formatCurrency(summary.income, { showSign: true, compact: true })}
              </span>
            )}
            {summary.expense > 0 && (
              <span className="calendar-day-expense">
                {formatCurrency(-summary.expense, { compact: true })}
              </span>
            )}
          </span>
        )}
      </>
    )

    if (!cell.inMonth) {
      return (
        <div key={cell.key} role="presentation" className={classes}>
          {content}
        </div>
      )
    }

    return (
      <button
        key={cell.key}
        type="button"
        className={`${classes} calendar-day-btn`}
        onClick={() => onSelectDay(cell.key)}
        disabled={!hasActivity}
        aria-label={ariaLabel}
        aria-pressed={hasActivity ? isSelected : undefined}
        aria-current={cell.isToday ? 'date' : undefined}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="transaction-calendar card">
      <div className="calendar-header">
        <h3 className="calendar-title">Daily Activity</h3>
        <div className="calendar-nav">
          <button type="button" className="calendar-nav-btn" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="calendar-month-label">{getMonthLabel(currentMonth)}</span>
          <button type="button" className="calendar-nav-btn" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map(label => (
          <span key={label} className="calendar-weekday">{label}</span>
        ))}
      </div>

      <div className="calendar-grid" key={getMonthKey(currentMonth)}>
        {cells.map(renderCell)}
      </div>

      {isEmptyMonth && (
        <p className="calendar-empty-note">No transactions this month</p>
      )}
    </div>
  )
}
