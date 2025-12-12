'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BacklogItem } from '@/types/item'

export function BacklogColumn() {
  const backlogItems: BacklogItem[] = []
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Backlog</span>
          <span className="text-sm font-normal text-muted-foreground">
            {backlogItems.length}件
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">todo</CardContent>
    </Card>
  )
}
