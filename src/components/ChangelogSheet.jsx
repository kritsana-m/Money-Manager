import { Sparkles } from 'lucide-react'

export default function ChangelogSheet({ changelogs, onClose }) {
  return (
    <div className="changelog-sheet">
      <div className="changelog-header">
        <div className="changelog-icon-wrapper">
          <Sparkles size={24} />
        </div>
        <h2 className="changelog-title">What's New</h2>
        <p className="changelog-subtitle">
          Here's what changed in the latest update
        </p>
      </div>

      <div className="changelog-entries">
        {changelogs.map(entry => (
          <div key={entry.version} className="changelog-entry">
            <div className="changelog-version-row">
              <span className="changelog-version-badge">v{entry.version}</span>
              <span className="changelog-date">{entry.date}</span>
            </div>
            <ul className="changelog-list">
              {entry.changes.map((change, i) => (
                <li key={i} className="changelog-item">{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button className="btn btn-primary changelog-cta" onClick={onClose}>
        Got it
      </button>
    </div>
  )
}
