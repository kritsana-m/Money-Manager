export const TRANSACTION_CATEGORIES = [
  { id: 'food', name: 'Food & Drink', icon: 'UtensilsCrossed', color: '#C4785B' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#7B8FA1' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#B8856C' },
  { id: 'bills', name: 'Bills', icon: 'Receipt', color: '#8B7355' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', color: '#9B8FA1' },
  { id: 'health', name: 'Health', icon: 'Heart', color: '#8B9E7E' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#6B8E9B' },
  { id: 'salary', name: 'Salary', icon: 'Banknote', color: '#7BA07E' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#6B9E8B' },
  { id: 'gift', name: 'Gift', icon: 'Gift', color: '#C49B7B' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp', color: '#5B8A72' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#A09890' }
]

export const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', name: 'Streaming', icon: 'Play', color: '#C4785B' },
  { id: 'music', name: 'Music', icon: 'Music', color: '#9B8FA1' },
  { id: 'cloud', name: 'Cloud Storage', icon: 'Cloud', color: '#6B8E9B' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', color: '#8B9E7E' },
  { id: 'news', name: 'News & Reading', icon: 'BookOpen', color: '#8B7355' },
  { id: 'software', name: 'Software', icon: 'Monitor', color: '#7B8FA1' },
  { id: 'gaming', name: 'Gaming', icon: 'Gamepad2', color: '#B8856C' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#5B8A72' },
  { id: 'membership', name: 'Membership', icon: 'CreditCard', color: '#C49B7B' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#A09890' }
]

export function getCategoryById(id, type = 'transaction') {
  const categories = type === 'subscription' ? SUBSCRIPTION_CATEGORIES : TRANSACTION_CATEGORIES
  return categories.find(c => c.id === id) || categories[categories.length - 1]
}

export function getCategoryColor(id, type = 'transaction') {
  return getCategoryById(id, type).color
}
