import { Routes, Route } from 'react-router-dom'
import Transactions from './pages/Transactions'
import Subscriptions from './pages/Subscriptions'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Transactions />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  )
}
