import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isToday, isSameDay, parseISO, differenceInCalendarMonths } from 'date-fns'

export function getMonthKey(date) {
  return format(date, 'yyyy-MM')
}

export function getMonthLabel(date) {
  return format(date, 'MMMM yyyy')
}

export function getShortMonthLabel(date) {
  return format(date, 'MMM yyyy')
}

export function getDayLabel(date) {
  if (isToday(date)) return 'Today'
  return format(date, 'EEE, d MMM')
}

export function getDateKey(date) {
  return format(date, 'yyyy-MM-dd')
}

export function formatDate(date, pattern = 'dd MMM yyyy') {
  return format(date, pattern)
}

export function getMonthRange(date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  }
}

export function getNextMonth(date) {
  return addMonths(date, 1)
}

export function getPrevMonth(date) {
  return subMonths(date, 1)
}

export function getDaysInMonth(date) {
  const { start, end } = getMonthRange(date)
  return eachDayOfInterval({ start, end })
}

export function parseDate(dateString) {
  if (dateString instanceof Date) return dateString
  return parseISO(dateString)
}

export function isSameDateDay(date1, date2) {
  return isSameDay(date1, date2)
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date())
}

export function getMonthKeysDifference(monthKey1, monthKey2) {
  const date1 = parseISO(`${monthKey1}-01`)
  const date2 = parseISO(`${monthKey2}-01`)
  return differenceInCalendarMonths(date1, date2)
}

