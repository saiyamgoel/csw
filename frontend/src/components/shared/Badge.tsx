import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const styles: Record<Variant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'neutral', className }: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  )
}

export function StockBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    IN_STOCK: { label: 'In Stock', variant: 'success' },
    LOW_STOCK: { label: 'Low Stock', variant: 'warning' },
    OUT_OF_STOCK: { label: 'Out of Stock', variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}

export function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    RAW_MATERIAL: { label: 'Raw Material', variant: 'info' },
    ACCESSORY: { label: 'Accessory', variant: 'neutral' },
    PACKAGING: { label: 'Packaging', variant: 'success' },
  }
  const { label, variant } = map[category] ?? { label: category, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}
