import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden hover-lift glass-card group', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="font-display text-4xl tracking-wide">{value}</p>
            {subtitle && (
              <p className={cn(
                'text-sm',
                trend === 'up' && 'text-emerald-500',
                trend === 'down' && 'text-red-500',
                (!trend || trend === 'neutral') && 'text-muted-foreground'
              )}>
                {trend === 'up' && '↑ '}
                {trend === 'down' && '↓ '}
                {subtitle}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gold/15 flex items-center justify-center group-hover:bg-gold/25 transition-colors duration-300">
            <Icon className="h-6 w-6 text-gold transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
