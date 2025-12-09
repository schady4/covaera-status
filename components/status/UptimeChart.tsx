'use client'

import { StatusLevel, statusColors, componentLabels, ComponentType } from '@/lib/utils/status-levels'
import { cn } from '@/lib/utils/cn'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format, parseISO } from 'date-fns'

interface DailyStatus {
  date: string
  status: StatusLevel
  uptimePercentage: number
}

interface UptimeChartProps {
  component: ComponentType
  dailyData: DailyStatus[]
  uptimePercentage: number
}

export function UptimeChart({
  component,
  dailyData,
  uptimePercentage,
}: UptimeChartProps) {
  // Show last 90 days, most recent on right
  const displayData = dailyData.slice(-90)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{componentLabels[component]}</span>
        <span className="text-sm font-semibold text-status-operational">
          {uptimePercentage.toFixed(2)}%
        </span>
      </div>
      <TooltipProvider>
        <div className="flex gap-[2px]">
          {displayData.map((day, index) => (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-8 flex-1 rounded-sm transition-opacity hover:opacity-80',
                    statusColors[day.status]
                  )}
                  style={{ minWidth: '2px', maxWidth: '8px' }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {format(parseISO(day.date), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {day.uptimePercentage.toFixed(2)}% uptime
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

interface UptimeChartListProps {
  components: Array<{
    component: ComponentType
    dailyData: DailyStatus[]
    uptimePercentage: number
  }>
}

export function UptimeChartList({ components }: UptimeChartListProps) {
  return (
    <div className="space-y-6">
      {components.map((c) => (
        <UptimeChart
          key={c.component}
          component={c.component}
          dailyData={c.dailyData}
          uptimePercentage={c.uptimePercentage}
        />
      ))}
    </div>
  )
}
