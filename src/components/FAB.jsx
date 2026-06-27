import { Plus } from 'lucide-react'
import './FAB.css'

export default function FAB({ onClick, label = 'Add' }) {
  return (
    <button className="fab" onClick={onClick} aria-label={label}>
      <Plus size={24} strokeWidth={2.5} />
    </button>
  )
}
