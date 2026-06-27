import { useState, useEffect, useCallback } from 'react'
import { getDB } from './database'
import { getMonthKey, getDateKey } from '../utils/dates'

export function useTransactions(selectedMonth) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const monthKey = selectedMonth ? getMonthKey(selectedMonth) : getMonthKey(new Date())

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const db = await getDB()
      const all = await db.getAllFromIndex('transactions', 'monthKey', monthKey)
      // Sort by date descending, then by createdAt descending
      all.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date)
        if (dateDiff !== 0) return dateDiff
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      setTransactions(all)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const addTransaction = useCallback(async (data) => {
    const db = await getDB()
    const transaction = {
      ...data,
      amount: parseFloat(data.amount),
      monthKey: getMonthKey(new Date(data.date)),
      dateKey: getDateKey(new Date(data.date)),
      createdAt: Date.now()
    }
    await db.add('transactions', transaction)
    await loadTransactions()
  }, [loadTransactions])

  const updateTransaction = useCallback(async (id, data) => {
    const db = await getDB()
    const existing = await db.get('transactions', id)
    if (!existing) return
    const updated = {
      ...existing,
      ...data,
      amount: parseFloat(data.amount),
      monthKey: getMonthKey(new Date(data.date)),
      dateKey: getDateKey(new Date(data.date)),
      updatedAt: Date.now()
    }
    await db.put('transactions', updated)
    await loadTransactions()
  }, [loadTransactions])

  const deleteTransaction = useCallback(async (id) => {
    const db = await getDB()
    await db.delete('transactions', id)
    await loadTransactions()
  }, [loadTransactions])

  // Computed summaries
  const summary = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    get net() {
      return this.totalIncome - this.totalExpense
    }
  }

  // Group by date
  const groupedByDate = transactions.reduce((groups, t) => {
    const key = t.dateKey
    if (!groups[key]) {
      groups[key] = { date: t.date, transactions: [], income: 0, expense: 0 }
    }
    groups[key].transactions.push(t)
    if (t.type === 'income') groups[key].income += t.amount
    else groups[key].expense += t.amount
    return groups
  }, {})

  // Category breakdown for expenses
  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((cats, t) => {
      if (!cats[t.category]) {
        cats[t.category] = { category: t.category, amount: 0, count: 0 }
      }
      cats[t.category].amount += t.amount
      cats[t.category].count += 1
      return cats
    }, {})

  // Daily totals for chart
  const dailyTotals = transactions.reduce((days, t) => {
    const key = t.dateKey
    if (!days[key]) {
      days[key] = { date: key, income: 0, expense: 0 }
    }
    if (t.type === 'income') days[key].income += t.amount
    else days[key].expense += t.amount
    return days
  }, {})

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    summary,
    groupedByDate,
    categoryBreakdown: Object.values(categoryBreakdown),
    dailyTotals: Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date)),
    refresh: loadTransactions
  }
}
