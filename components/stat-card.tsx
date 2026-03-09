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
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
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
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
