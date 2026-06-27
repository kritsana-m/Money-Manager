import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import './BottomSheet.css'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const sheetRef = useRef(null)
  const backdropRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="bottom-sheet-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
    >
      <div className="bottom-sheet" ref={sheetRef}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <h2 className="bottom-sheet-title">{title}</h2>
          <button className="bottom-sheet-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  )
}
