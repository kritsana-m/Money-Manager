import { useState, useEffect, useCallback } from 'react'
import { getDB } from './database'
import { getMonthKey, getMonthKeysDifference } from '../utils/dates'

export function useSubscriptions(selectedMonth) {
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const monthKey = selectedMonth ? getMonthKey(selectedMonth) : getMonthKey(new Date())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const db = await getDB()
      const allSubs = await db.getAll('subscriptions')
      const allPayments = await db.getAllFromIndex('subscriptionPayments', 'monthKey', monthKey)
      
      // Filter subscriptions active in this monthKey
      const activeSubs = allSubs.filter(sub => {
        if (!sub.startMonth) {
          // Backward compatibility for legacy subscriptions that have no startMonth
          return true
        }
        
        const diff = getMonthKeysDifference(monthKey, sub.startMonth)
        if (diff < 0) {
          // Subscription hasn't started yet
          return false
        }
        
        if (sub.periodMonths === undefined || sub.periodMonths === null || isNaN(sub.periodMonths)) {
          // Indefinite/ongoing subscription
          return true
        }
        
        // Installment subscription: active if current month falls within the period
        return diff < sub.periodMonths
      })

      activeSubs.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setSubscriptions(activeSubs)
      setPayments(allPayments)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addSubscription = useCallback(async (data) => {
    const db = await getDB()
    const subscription = {
      ...data,
      amount: parseFloat(data.amount),
      periodMonths: data.periodMonths ? parseInt(data.periodMonths, 10) : null,
      startMonth: data.startMonth || monthKey,
      createdAt: Date.now()
    }
    await db.add('subscriptions', subscription)
    await loadData()
  }, [loadData, monthKey])

  const updateSubscription = useCallback(async (id, data) => {
    const db = await getDB()
    const existing = await db.get('subscriptions', id)
    if (!existing) return
    const updated = {
      ...existing,
      ...data,
      amount: parseFloat(data.amount),
      periodMonths: data.periodMonths ? parseInt(data.periodMonths, 10) : null,
      startMonth: data.startMonth || existing.startMonth || monthKey,
      updatedAt: Date.now()
    }
    await db.put('subscriptions', updated)
    await loadData()
  }, [loadData, monthKey])

  const deleteSubscription = useCallback(async (id) => {
    const db = await getDB()
    // Delete the subscription
    await db.delete('subscriptions', id)
    // Delete all related payments
    const allPayments = await db.getAllFromIndex('subscriptionPayments', 'subscriptionId', id)
    const tx = db.transaction('subscriptionPayments', 'readwrite')
    for (const p of allPayments) {
      await tx.store.delete(p.id)
    }
    await tx.done
    await loadData()
  }, [loadData])

  const togglePaid = useCallback(async (subscriptionId) => {
    const db = await getDB()
    // Check if already paid for this month
    const existing = await db.getAllFromIndex('subscriptionPayments', 'subMonth', [subscriptionId, monthKey])
    
    if (existing.length > 0) {
      // Unpay - remove payment record
      const tx = db.transaction('subscriptionPayments', 'readwrite')
      for (const p of existing) {
        await tx.store.delete(p.id)
      }
      await tx.done
    } else {
      // Pay - add payment record
      await db.add('subscriptionPayments', {
        subscriptionId,
        monthKey,
        paidAt: Date.now()
      })
    }
    await loadData()
  }, [monthKey, loadData])

  // Merge subscriptions with payment status and calculate period info
  const subscriptionsWithStatus = subscriptions.map(sub => {
    const isPaid = payments.some(p => p.subscriptionId === sub.id)
    let periodInfo = null
    
    if (sub.startMonth && sub.periodMonths !== undefined && sub.periodMonths !== null && !isNaN(sub.periodMonths)) {
      const diff = getMonthKeysDifference(monthKey, sub.startMonth)
      periodInfo = {
        currentMonth: diff + 1,
        totalMonths: sub.periodMonths,
        isLastPayment: diff === sub.periodMonths - 1
      }
    }
    
    return {
      ...sub,
      isPaid,
      periodInfo
    }
  })

  // Summary
  const summary = {
    totalCost: subscriptions.reduce((sum, s) => sum + s.amount, 0),
    totalPaid: subscriptionsWithStatus
      .filter(s => s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0),
    get totalUnpaid() {
      return this.totalCost - this.totalPaid
    },
    paidCount: subscriptionsWithStatus.filter(s => s.isPaid).length,
    unpaidCount: subscriptionsWithStatus.filter(s => !s.isPaid).length,
    total: subscriptions.length
  }

  return {
    subscriptions: subscriptionsWithStatus,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    togglePaid,
    summary,
    refresh: loadData
  }
}
