import { useState, useRef, useCallback } from 'react'
import { Download, Upload, CheckCircle, AlertTriangle, ArrowLeft, FileText } from 'lucide-react'
import { exportData, importData, validateImportData } from '../db/backup'
import { formatCurrency } from '../utils/currency'
import './SyncBackup.css'

export default function SyncBackup() {
  const [step, setStep] = useState('main')
  const [parsedData, setParsedData] = useState(null)
  const [validation, setValidation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const fileInputRef = useRef(null)

  const reset = useCallback(() => {
    setStep('main')
    setParsedData(null)
    setValidation(null)
    setError(null)
    setExportDone(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    setExportDone(false)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const today = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `money-manager-backup-${today}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = validateImportData(data)
      setParsedData(data)
      setValidation(result)
      setStep('preview')
    } catch (err) {
      setError('Invalid file: ' + (err.message || 'Could not parse JSON'))
      reset()
    }
  }

  const handleContinue = () => {
    setStep('confirm')
  }

  const handleConfirmImport = async () => {
    setLoading(true)
    setError(null)
    try {
      await importData(parsedData)
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'confirm') setStep('preview')
    else reset()
  }

  if (step !== 'main') {
    return (
      <div className="page">
        <div className="page-header">
          <div className="import-header">
            <button className="import-back-btn" onClick={handleBack} aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <h1 className="page-title">
              {step === 'preview' ? 'Preview Import' : 'Replace Data?'}
            </h1>
          </div>
        </div>

        {validation && !validation.valid && (
          <div className="import-error-box">
            <AlertTriangle size={18} />
            <div>
              <strong>Invalid backup file</strong>
              {validation.errors.map((err, i) => (
                <p key={i} className="import-error-line">{err}</p>
              ))}
            </div>
          </div>
        )}

        {validation && validation.valid && validation.summary && (
          <div className="card import-summary-card">
            <div className="import-summary-header">
              <FileText size={20} />
              <span>Backup Summary</span>
            </div>
            <div className="import-summary-rows">
              <div className="import-summary-row">
                <span>Transactions</span>
                <strong>{validation.summary.transactions}</strong>
              </div>
              <div className="import-summary-row">
                <span>Subscriptions</span>
                <strong>{validation.summary.subscriptions}</strong>
              </div>
              <div className="import-summary-row">
                <span>Payments</span>
                <strong>{validation.summary.payments}</strong>
              </div>
              <div className="import-divider" />
              <div className="import-summary-row">
                <span>Total Income</span>
                <strong className="import-income">{formatCurrency(validation.summary.totalIncome)}</strong>
              </div>
              <div className="import-summary-row">
                <span>Total Expense</span>
                <strong className="import-expense">{formatCurrency(validation.summary.totalExpense)}</strong>
              </div>
              {validation.summary.dateRange && (
                <div className="import-summary-row">
                  <span>Date Range</span>
                  <strong>{validation.summary.dateRange}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="card import-warning-card">
            <div className="import-warning-row">
              <AlertTriangle size={20} />
              <span>This will replace ALL existing data with the imported data. This action cannot be undone.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="sync-error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="import-actions">
          <button
            className="import-btn import-btn--cancel"
            onClick={reset}
            disabled={loading}
          >
            Cancel
          </button>
          {step === 'preview' && validation?.valid && (
            <button
              className="import-btn import-btn--continue"
              onClick={handleContinue}
            >
              Continue
            </button>
          )}
          {step === 'confirm' && (
            <button
              className="import-btn import-btn--replace"
              onClick={handleConfirmImport}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Replace & Import'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Data</h1>
      </div>

      <div className="card sync-card">
        <div className="sync-section">
          <div className="sync-section-icon sync-section-icon--export">
            <Download size={20} />
          </div>
          <div className="sync-section-body">
            <h3 className="sync-section-title">Export</h3>
            <p className="sync-section-desc">Save all data as a JSON backup file</p>
          </div>
          <button
            className="sync-action-btn"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Exporting...' : exportDone ? <CheckCircle size={18} /> : 'Export'}
          </button>
        </div>

        <div className="sync-divider" />

        <div className="sync-section">
          <div className="sync-section-icon sync-section-icon--import">
            <Upload size={20} />
          </div>
          <div className="sync-section-body">
            <h3 className="sync-section-title">Import</h3>
            <p className="sync-section-desc">Restore data from a backup file</p>
          </div>
          <button
            className="sync-action-btn sync-action-btn--import"
            onClick={handleImportClick}
          >
            Choose File
          </button>
        </div>
      </div>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div className="sync-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </div>
  )
}
