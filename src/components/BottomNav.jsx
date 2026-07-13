import { useLocation, useNavigate } from 'react-router-dom'
import { Receipt, RefreshCw, Download } from 'lucide-react'
import { APP_VERSION } from '../utils/version'
import './BottomNav.css'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { path: '/', label: 'Transactions', icon: Receipt },
    { path: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { path: '/sync', label: 'Data', icon: Download }
  ]

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`bottom-nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="bottom-nav-label">{tab.label}</span>
            {isActive && <div className="bottom-nav-indicator" />}
          </button>
        )
      })}
      <span className="bottom-nav-version">v{APP_VERSION}</span>
    </nav>
  )
}
