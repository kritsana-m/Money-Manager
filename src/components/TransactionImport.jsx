import { AlertTriangle, FileText } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import './SyncBackup.css'
import './TransactionImport.css'

const PREVIEW_LIMIT = 20
const NOTE_PREVIEW_LENGTH = 60

function truncateNote(note) {
  if (!note) return '—'
  return note.length > NOTE_PREVIEW_LENGTH ? note.slice(0, NOTE_PREVIEW_LENGTH) + '…' : note
}

export default function TransactionImport({ fileName, preview, importing, onConfirm, onCancel }) {
  const { items, duplicates, errors, summary } = preview
  const shownErrors = errors.slice(0, 10)
  const hiddenErrorCount = errors.length - shownErrors.length
  const shownItems = items.slice(0, PREVIEW_LIMIT)
  const hiddenItemCount = items.length - shownItems.length

  return (
    <div className="tx-import">
      <div className="card import-summary-card">
        <div className="import-summary-header">
          <FileText size={20} />
          <span>Import Preview</span>
        </div>
        <div className="import-summary-rows">
          <div className="import-summary-row">
            <span>File</span>
            <strong className="tx-import-filename">{fileName}</strong>
          </div>
          <div className="import-summary-row">
            <span>New records</span>
            <strong>{summary.count}</strong>
          </div>
          <div className="import-divider" />
          <div className="import-summary-row">
            <span>Total Income</span>
            <strong className="import-income">{formatCurrency(summary.totalIncome)}</strong>
          </div>
          <div className="import-summary-row">
            <span>Total Expense</span>
            <strong className="import-expense">{formatCurrency(summary.totalExpense)}</strong>
          </div>
          {duplicates > 0 && (
            <div className="import-summary-row">
              <span>Skipped (duplicates)</span>
              <strong>{duplicates}</strong>
            </div>
          )}
          {errors.length > 0 && (
            <div className="import-summary-row">
              <span>Skipped (errors)</span>
              <strong>{errors.length}</strong>
            </div>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="import-error-box">
          <AlertTriangle size={18} />
          <div>
            <strong>Skipped lines</strong>
            {shownErrors.map((err, i) => (
              <p key={i} className="import-error-line">{err}</p>
            ))}
            {hiddenErrorCount > 0 && (
              <p className="import-error-line">…and {hiddenErrorCount} more</p>
            )}
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="card tx-import-list-card">
          <div className="tx-import-list">
            {shownItems.map((t, i) => (
              <div key={i} className="tx-import-row">
                <div className="tx-import-row-main">
                  <span className="tx-import-date">{t.date}</span>
                  <span className={`tx-import-type tx-import-type--${t.type}`}>{t.type}</span>
                </div>
                <div className="tx-import-row-sub">
                  <span className="tx-import-note">{truncateNote(t.note)}</span>
                  <span className={`tx-import-amount tx-import-amount--${t.type}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {hiddenItemCount > 0 && (
            <p className="tx-import-more">…and {hiddenItemCount} more records</p>
          )}
        </div>
      ) : (
        <div className="import-error-box">
          <AlertTriangle size={18} />
          <div>
            <strong>No valid records found</strong>
            <p className="import-error-line">Check that the file follows the Date/Type/Amount/Description format.</p>
          </div>
        </div>
      )}

      <div className="import-actions">
        <button
          className="import-btn import-btn--cancel"
          onClick={onCancel}
          disabled={importing}
        >
          Cancel
        </button>
        <button
          className="import-btn import-btn--continue"
          onClick={onConfirm}
          disabled={importing || items.length === 0}
        >
          {importing ? 'Importing...' : `Import ${items.length} record${items.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
