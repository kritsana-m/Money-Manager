import { useState, useEffect } from 'react'
import { Cloud, CloudDownload, CheckCircle, AlertTriangle, Link2, RefreshCw } from 'lucide-react'
import {
  getSheetConfig,
  setSheetConfig,
  clearSheetConfig,
  fetchSheetTransactions,
  sheetRowsToItems
} from '../utils/sheetSync'
import { getDB } from '../db/database'
import { dedupeTransactions, summarizeImport } from '../utils/importTransactions'
import { getMonthKey, getDateKey } from '../utils/dates'
import TransactionImport from './TransactionImport'
import './SyncBackup.css'

async function addTransactionsBulk(items) {
  const db = await getDB()
  const tx = db.transaction('transactions', 'readwrite')
  for (const data of items) {
    await tx.store.add({
      ...data,
      amount: parseFloat(data.amount),
      monthKey: getMonthKey(new Date(data.date)),
      dateKey: getDateKey(new Date(data.date)),
      createdAt: Date.now()
    })
  }
  await tx.done
}

function displayUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return (u.hostname + u.pathname).replace(/\/exec$/, '/…/exec')
  } catch {
    return url
  }
}

export default function GoogleSheetSync() {
  const [config, setConfigState] = useState(getSheetConfig)
  const [editing, setEditing] = useState(false)
  const [urlInput, setUrlInput] = useState(config?.url || '')
  const [tokenInput, setTokenInput] = useState(config?.token || '')
  const [saving, setSaving] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (editing) {
      setUrlInput(config?.url || '')
      setTokenInput(config?.token || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const handleSave = () => {
    const url = urlInput.trim()
    setSaving(true)
    setError(null)
    if (!url) {
      setError('Paste the Apps Script Web App URL (ends with /exec)')
      setSaving(false)
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      setError('That is not a valid URL')
      setSaving(false)
      return
    }
    const next = { url, token: tokenInput.trim() }
    setSheetConfig(next)
    setConfigState(next)
    setEditing(false)
    setSaving(false)
  }

  const handlePull = async () => {
    setPulling(true)
    setError(null)
    setDone(null)
    setPreview(null)
    try {
      const data = await fetchSheetTransactions(config)
      const { items, errors } = sheetRowsToItems(data.transactions)
      const db = await getDB()
      const existing = await db.getAll('transactions')
      const { items: cleanItems, duplicates } = dedupeTransactions(items, existing)

      if (cleanItems.length === 0 && duplicates > 0 && errors.length === 0) {
        setDone({ count: 0, duplicates, duplicateOnly: true })
        setPreview(null)
        return
      }
      setPreview({ items: cleanItems, duplicates, errors, summary: summarizeImport(cleanItems) })
    } catch (err) {
      setError(err.message || 'Pull failed')
    } finally {
      setPulling(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview || preview.items.length === 0) return
    setImporting(true)
    setError(null)
    try {
      await addTransactionsBulk(preview.items)
      setDone({
        count: preview.items.length,
        income: preview.summary.totalIncome,
        expense: preview.summary.totalExpense
      })
      setPreview(null)
    } catch (err) {
      setError('Import failed: ' + (err.message || 'unknown error'))
    } finally {
      setImporting(false)
    }
  }

  const handleClear = () => {
    clearSheetConfig()
    setConfigState(null)
    setPreview(null)
    setDone(null)
    setError(null)
    setEditing(false)
  }

  return (
    <div className="card sync-card sheet-sync-card">
      <div className="sync-section">
        <div className="sync-section-icon sync-section-icon--sheet">
          <Cloud size={20} />
        </div>
        <div className="sync-section-body">
          <h3 className="sync-section-title">Google Sheet</h3>
          <p className="sync-section-desc">
            {config
              ? `Connected · ${displayUrl(config.url)}`
              : 'Pull transactions pushed from iPhone Shortcuts via Google Sheets'}
          </p>
        </div>
        {config && !editing ? (
          <button
            className="sync-action-btn sync-action-btn--sheet"
            onClick={handlePull}
            disabled={pulling || importing}
          >
            {pulling ? <RefreshCw size={18} className="spin" /> : <CloudDownload size={18} />}
            {pulling ? 'Pulling…' : 'Pull'}
          </button>
        ) : (
          <button
            className="sync-action-btn sync-action-btn--sheet"
            onClick={() => setEditing(true)}
            disabled={saving}
          >
            Configure
          </button>
        )}
      </div>

      {config && !editing && (
        <>
          <div className="sync-divider" />
          <div className="sync-section sync-section--meta">
            <div className="sync-section-body">
              <p className="sync-fine-print">
                URL: {displayUrl(config.url)}
                {config.token ? ' · token saved' : ''}
              </p>
            </div>
            <button className="sheet-link-btn" onClick={() => setEditing(true)}>Edit</button>
            <button className="sheet-link-btn sheet-link-btn--danger" onClick={handleClear}>Disconnect</button>
          </div>
        </>
      )}

      {editing && (
        <>
          <div className="sync-divider" />
          <div className="sheet-config">
            <div className="sheet-field">
              <label className="sheet-label" htmlFor="sheet-url">Web App URL</label>
              <div className="sheet-input-wrap">
                <Link2 size={16} />
                <input
                  id="sheet-url"
                  className="sheet-input"
                  type="url"
                  inputMode="url"
                  placeholder="https://script.google.com/macros/s/…/exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <p className="sheet-hint">From Apps Script ▸ Deploy ▸ Web app (ends with /exec)</p>
            </div>
            <div className="sheet-field">
              <label className="sheet-label" htmlFor="sheet-token">Token (optional)</label>
              <div className="sheet-input-wrap">
                <input
                  id="sheet-token"
                  className="sheet-input"
                  type="password"
                  autoComplete="off"
                  placeholder="Key shared with the web app"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              <p className="sheet-hint">Same value as the TOKEN script property. Leave blank if unset.</p>
            </div>

            <div className="import-actions">
              <button className="import-btn import-btn--cancel" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
              <button className="import-btn import-btn--continue" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Connection'}
              </button>
            </div>

            {!config && (
              <div className="sheet-note">
                <AlertTriangle size={16} />
                <span>Anyone who knows this URL could read your sheet. Use a personal token and see the Apps Script README.</span>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="sync-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {done && (
        <div className="sync-success">
          <CheckCircle size={16} />
          <div>
            {done.duplicateOnly ? (
              <>
                <strong>Nothing new to import</strong>
                <p className="sync-fine-print">{done.duplicates} pulled record{done.duplicates === 1 ? '' : 's'} already in the app</p>
              </>
            ) : (
              <>
                <strong>{done.count} transaction{done.count === 1 ? '' : 's'} imported from Google Sheet</strong>
                <p className="sync-fine-print">
                  Income {new Intl.NumberFormat('th-TH').format(done.income)} · Expense {new Intl.NumberFormat('th-TH').format(done.expense)}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {preview && (
        <TransactionImport
          fileName="google-sheet"
          preview={preview}
          importing={importing}
          onConfirm={handleConfirm}
          onCancel={() => { setPreview(null); setError(null) }}
        />
      )}
    </div>
  )
}
