import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Transactions from './pages/Transactions'
import Subscriptions from './pages/Subscriptions'
import SyncBackup from './components/SyncBackup'
import BottomNav from './components/BottomNav'
import BottomSheet from './components/BottomSheet'
import ChangelogSheet from './components/ChangelogSheet'
import { hasNewVersion, getNewChangelogs, setLastSeenVersion, APP_VERSION } from './utils/version'
import './components/ChangelogSheet.css'

export default function App() {
  const [showChangelog, setShowChangelog] = useState(false)
  const [changelogs, setChangelogs] = useState([])

  useEffect(() => {
    if (hasNewVersion()) {
      setChangelogs(getNewChangelogs())
      setShowChangelog(true)
    }
  }, [])

  const handleCloseChangelog = () => {
    setShowChangelog(false)
    setLastSeenVersion(APP_VERSION)
  }

  return (
    <>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Transactions />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/sync" element={
            <div className="page-container">
              <header className="page-header">
                <h1>Sync & Backup</h1>
              </header>
              <SyncBackup />
            </div>
          } />
        </Routes>
      </div>
      <BottomNav />

      <BottomSheet
        isOpen={showChangelog}
        onClose={handleCloseChangelog}
        title=""
      >
        <ChangelogSheet
          changelogs={changelogs}
          onClose={handleCloseChangelog}
        />
      </BottomSheet>
    </>
  )
}
