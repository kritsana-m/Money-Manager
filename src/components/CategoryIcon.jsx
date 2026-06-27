import * as Icons from 'lucide-react'
import { getCategoryById } from '../utils/categories'

export default function CategoryIcon({ categoryId, type = 'transaction', size = 20 }) {
  const category = getCategoryById(categoryId, type)
  const IconComponent = Icons[category.icon] || Icons.MoreHorizontal

  return (
    <div
      className="category-icon"
      style={{
        backgroundColor: category.color + '18',
        color: category.color,
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) * 0.3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <IconComponent size={size} />
    </div>
  )
}
