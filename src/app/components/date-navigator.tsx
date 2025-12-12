'use client'

import { useDate } from '@/app/hooks/useDate'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'

export function DateNavigation() {
  const { currentDate, setCurrentDate } = useDate()

  const formatDisplayDate = (dateStr: string | Date) => {
    const targetDate = dayjs(dateStr).locale('ja').startOf('day')
    const today = dayjs().startOf('day')
    const diffDays = targetDate.diff(today, 'day')

    const dayName = targetDate.format('dd')
    const dateStrFormatted = targetDate.format('M/D')

    if (diffDays === 0) return `今日 (${dateStrFormatted} ${dayName})`
    if (diffDays === 1) return `明日 (${dateStrFormatted} ${dayName})`
    if (diffDays === -1) return `昨日 (${dateStrFormatted} ${dayName})`

    return `${dateStrFormatted} (${dayName})`
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = dayjs(currentDate)
    const newDate =
      direction === 'next' ? date.add(1, 'day') : date.subtract(1, 'day')
    setCurrentDate(newDate.toDate())
  }

  const goToToday = () => {
    setCurrentDate(dayjs().toDate())
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDate('prev')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        onClick={goToToday}
        className="min-w-[160px] font-medium"
      >
        {formatDisplayDate(currentDate)}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateDate('next')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
