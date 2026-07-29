import { useState, useEffect, useCallback } from 'react'
import { getDB } from './database'
import { getMonthKey, getDateKey } from '../utils/dates'

export function useFuelRecords(selectedMonth) {
  const [records, setRecords] = useState([])
  const [allRecords, setAllRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const monthKey = selectedMonth ? getMonthKey(selectedMonth) : getMonthKey(new Date())

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const db = await getDB()
      const all = await db.getAll('fuelRecords')
      all.sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date)
        if (dateCmp !== 0) return dateCmp
        return (a.odometer || 0) - (b.odometer || 0)
      })

      const withEfficiency = all.map((record, idx) => {
        const prevRecord = idx > 0 ? all[idx - 1] : null
        let kmDriven = null
        let kmPerLiter = null

        if (prevRecord && record.odometer && prevRecord.odometer) {
          kmDriven = record.odometer - prevRecord.odometer
          if (record.liters > 0) {
            kmPerLiter = kmDriven / record.liters
          }
        }

        return { ...record, kmDriven, kmPerLiter }
      })

      setAllRecords(withEfficiency)
      setRecords(withEfficiency.filter(r => r.monthKey === monthKey))
    } catch (err) {
      console.error('Failed to load fuel records:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => { loadRecords() }, [loadRecords])

  const addRecord = useCallback(async (data) => {
    const db = await getDB()
    const record = {
      ...data,
      odometer: parseFloat(data.odometer),
      liters: parseFloat(data.liters),
      cost: parseFloat(data.cost),
      pricePerLiter: data.liters > 0 ? parseFloat(data.cost) / parseFloat(data.liters) : 0,
      isFullTank: !!data.isFullTank,
      monthKey: getMonthKey(new Date(data.date)),
      dateKey: getDateKey(new Date(data.date)),
      createdAt: Date.now()
    }
    await db.add('fuelRecords', record)
    await loadRecords()
  }, [loadRecords])

  const updateRecord = useCallback(async (id, data) => {
    const db = await getDB()
    const existing = await db.get('fuelRecords', id)
    if (!existing) return
    const updated = {
      ...existing, ...data,
      odometer: parseFloat(data.odometer),
      liters: parseFloat(data.liters),
      cost: parseFloat(data.cost),
      pricePerLiter: data.liters > 0 ? parseFloat(data.cost) / parseFloat(data.liters) : 0,
      isFullTank: !!data.isFullTank,
      monthKey: getMonthKey(new Date(data.date)),
      dateKey: getDateKey(new Date(data.date)),
      updatedAt: Date.now()
    }
    await db.put('fuelRecords', updated)
    await loadRecords()
  }, [loadRecords])

  const deleteRecord = useCallback(async (id) => {
    const db = await getDB()
    await db.delete('fuelRecords', id)
    await loadRecords()
  }, [loadRecords])

  const monthlySummary = {
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    totalLiters: records.reduce((sum, r) => sum + r.liters, 0),
    totalKmDriven: records.reduce((sum, r) => sum + (r.kmDriven || 0), 0),
    totalRecords: records.length,
    avgKmPerLiter: (() => {
      const totalLiters = records.reduce((sum, r) => sum + r.liters, 0)
      const totalKm = records.reduce((sum, r) => sum + (r.kmDriven || 0), 0)
      if (totalLiters > 0 && totalKm > 0) return totalKm / totalLiters
      return null
    })(),
    avgCostPerLiter: (() => {
      const totalLiters = records.reduce((sum, r) => sum + r.liters, 0)
      if (totalLiters > 0) return records.reduce((sum, r) => sum + r.cost, 0) / totalLiters
      return null
    })(),
  }

  return {
    records, allRecords, loading,
    addRecord, updateRecord, deleteRecord,
    monthlySummary, refresh: loadRecords
  }
}
