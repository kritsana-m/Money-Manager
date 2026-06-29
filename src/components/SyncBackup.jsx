import { useState, useEffect } from 'react'
import { initiateLogin, handleCallback, isLoggedIn, logout, uploadBackup, findBackupFile, downloadBackup } from '../utils/googleDrive'
import { exportData, importData } from '../db/backup'
import { Cloud, CloudOff, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'
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
    <div className="sync-backup-container">
      <div className="sync-header">
        {connected ? (
          <div className="status connected">
            <Cloud className="icon" />
            <span>Connected to Google Drive</span>
          </div>
        ) : (
          <div className="status disconnected">
            <CloudOff className="icon" />
            <span>Not connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-msg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="sync-actions">
        {!connected ? (
          <button 
            className="btn-primary" 
            onClick={initiateLogin}
            disabled={loading}
          >
            {loading ? <RefreshCw className="spin" /> : 'Connect Google Drive'}
          </button>
        ) : (
          <>
            <div className="backup-info">
              {lastBackup ? (
                <p>Last backup: {new Date(lastBackup.modifiedTime).toLocaleString()}</p>
              ) : (
                <p>No backup found on Drive</p>
              )}
            </div>
            
            <div className="btn-group">
              <button 
                className="btn-sync" 
                onClick={handleBackup}
                disabled={loading}
              >
                {loading ? <RefreshCw className="spin" /> : 'Backup Now'}
              </button>
              <button 
                className="btn-restore" 
                onClick={handleRestore}
                disabled={loading || !lastBackup}
              >
                Restore
              </button>
            </div>

            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
