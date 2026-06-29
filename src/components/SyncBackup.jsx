import { useState, useEffect } from 'react'
import { initiateLogin, handleCallback, isLoggedIn, logout, uploadBackup, findBackupFile, downloadBackup } from '../utils/googleDrive'
import { exportData, importData } from '../db/backup'
import { Cloud, CloudOff, RefreshCw, LogOut, AlertCircle } from 'lucide-react'
import './SyncBackup.css'

export default function SyncBackup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastBackup, setLastBackup] = useState(null)
  const [connected, setConnected] = useState(isLoggedIn())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      handleOAuthCallback()
    } else if (connected) {
      checkLastBackup()
    }
  }, [])

  const handleOAuthCallback = async () => {
    setLoading(true)
    try {
      await handleCallback()
      setConnected(true)
      await checkLastBackup()
    } catch (err) {
      setError('Authentication failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkLastBackup = async () => {
    try {
      const file = await findBackupFile()
      if (file) setLastBackup(file)
    } catch (err) {
      console.error('Failed to check backup:', err)
    }
  }

  const handleBackup = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await exportData()
      await uploadBackup(data)
      await checkLastBackup()
    } catch (err) {
      setError('Backup failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!window.confirm('This will overwrite your local data. Continue?')) return
    
    setLoading(true)
    setError(null)
    try {
      const file = await findBackupFile()
      if (!file) throw new Error('No backup found')
      const data = await downloadBackup(file.id)
      await importData(data)
      window.location.reload()
    } catch (err) {
      setError('Restore failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setConnected(false)
    setLastBackup(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sync & Backup</h1>
      </div>

      <div className="card sync-card">
        <div className="sync-status-row">
          {connected ? (
            <div className="sync-status sync-status--connected">
              <Cloud size={20} />
              <span>Connected to Google Drive</span>
            </div>
          ) : (
            <div className="sync-status sync-status--disconnected">
              <CloudOff size={20} />
              <span>Not connected</span>
            </div>
          )}
        </div>

        {error && (
          <div className="sync-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!connected ? (
          <button
            className="sync-btn sync-btn--connect"
            onClick={initiateLogin}
            disabled={loading}
          >
            {loading ? <RefreshCw className="sync-spin" size={18} /> : null}
            {loading ? 'Connecting...' : 'Connect Google Drive'}
          </button>
        ) : (
          <div className="sync-connected-content">
            <div className="sync-backup-info">
              {lastBackup ? (
                <p>Last backup: {new Date(lastBackup.modifiedTime).toLocaleString()}</p>
              ) : (
                <p className="sync-no-backup">No backup found on Drive</p>
              )}
            </div>

            <div className="sync-btn-group">
              <button
                className="sync-btn sync-btn--backup"
                onClick={handleBackup}
                disabled={loading}
              >
                {loading ? <RefreshCw className="sync-spin" size={18} /> : null}
                {loading ? 'Backing up...' : 'Backup Now'}
              </button>
              <button
                className="sync-btn sync-btn--restore"
                onClick={handleRestore}
                disabled={loading || !lastBackup}
              >
                Restore
              </button>
            </div>

            <button className="sync-btn sync-btn--logout" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
