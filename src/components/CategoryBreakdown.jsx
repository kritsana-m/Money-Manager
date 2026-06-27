import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../utils/currency'
import { getCategoryById } from '../utils/categories'

export default function CategoryBreakdown({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
        No expenses this month
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0)
  const chartData = data
    .sort((a, b) => b.amount - a.amount)
    .map(d => {
      const cat = getCategoryById(d.category)
      return {
        ...d,
        name: cat.name,
        color: cat.color,
        percent: ((d.amount / total) * 100).toFixed(1)
      }
    })

  return (
    <div className="category-breakdown">
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="amount"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chartData.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: item.color,
              flexShrink: 0
            }} />
            <span style={{ flex: 1, color: 'var(--color-text)' }}>{item.name}</span>
            <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{item.percent}%</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
