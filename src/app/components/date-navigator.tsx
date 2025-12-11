"use client"

import { useDate } from "@/app/hooks/useDate"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function DateNavigation() {
  const { currentDate, setCurrentDate } = useDate()

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    const dayNames = ["日", "月", "火", "水", "木", "金", "土"]
    const dayName = dayNames[date.getDay()]

    if (diffDays === 0) return `今日 (${date.getMonth() + 1}/${date.getDate()} ${dayName})`
    if (diffDays === 1) return `明日 (${date.getMonth() + 1}/${date.getDate()} ${dayName})`
    if (diffDays === -1) return `昨日 (${date.getMonth() + 1}/${date.getDate()} ${dayName})`

    return `${date.getMonth() + 1}/${date.getDate()} (${dayName})`
  }

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(date.toISOString().split("T")[0])
  }

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split("T")[0])
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" onClick={goToToday} className="min-w-[160px] font-medium">
        {formatDisplayDate(currentDate)}
      </Button>
      <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
