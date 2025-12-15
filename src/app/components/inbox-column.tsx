'use client'

import type React from 'react'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SortableItem } from './sortable-item'
import { StatusButton } from './status-button'
import { ItemCreationForm } from './item-creation-form'
import type { InboxItem } from '@/types/item'
import { useInboxItems } from '../hooks/useInboxItems'
import { useDateNavigation } from '../hooks/useDateNavigation'
import dayjs from 'dayjs'
import { useEffect } from 'react'

interface InboxColumnProps {
  /**
   * 初期データ（本日のInboxアイテム）
   */
  initialItems: InboxItem[]
  /**
   * Backlogの再フェッチ関数（オプション）
   */
  onBacklogRefresh?: () => Promise<void>
  /**
   * Inboxの再フェッチ関数を設定するコールバック
   */
  onInboxRefreshRef?: (refreshFn: () => Promise<void>) => void
}

export function InboxColumn({
  initialItems,
  onBacklogRefresh,
  onInboxRefreshRef,
}: InboxColumnProps) {
  // 初期日付は常に今日の日付を使用
  // （initialItemsには今日のタスクと今日より前の未完了タスクが含まれるため）
  const initialDate = dayjs().format('YYYY-MM-DD')

  // Inboxアイテム管理のカスタムフック
  const {
    currentDate,
    currentItems,
    changeDateAndFetch,
    addInboxItem,
    deleteInboxItem,
    reorderInboxItems,
    moveToWantToDo,
    cycleStatus,
    refreshInbox,
    loadingItemIds,
  } = useInboxItems({
    initialItems,
    initialDate,
    onBacklogRefresh,
  })

  // Inboxの再フェッチ関数を親コンポーネントに渡す
  useEffect(() => {
    if (onInboxRefreshRef) {
      onInboxRefreshRef(refreshInbox)
    }
  }, [onInboxRefreshRef, refreshInbox])

  // 日付ナビゲーションのカスタムフック
  const { formatDisplayDate, navigateDate, goToToday } = useDateNavigation({
    currentDate,
    onDateChange: changeDateAndFetch,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id)
      const newIndex = currentItems.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(currentItems, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index,
        }),
      )

      reorderInboxItems(reordered)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Inbox
            <span className="text-sm font-normal text-muted-foreground">
              {currentItems.length}件
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="h-7 px-2 text-xs font-medium"
            >
              {formatDisplayDate(currentDate)}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <ItemCreationForm
          placeholder="新しいタスクを追加..."
          onCreateItem={addInboxItem}
        />

        <div className="flex flex-1 flex-col gap-2">
          {currentItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground">
              タスクがありません
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentItems.map((item) => {
                  const isLoading = loadingItemIds.has(item.id)
                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <div
                        className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                          item.status === 'completed' ? 'opacity-60' : ''
                        }`}
                      >
                        <StatusButton
                          status={item.status}
                          isLoading={isLoading}
                          onClick={() => cycleStatus(item)}
                        />
                        <span
                          className={`flex-1 text-sm ${item.status === 'completed' ? 'line-through' : ''}`}
                        >
                          {item.title}
                        </span>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveToWantToDo(item.id)}
                            title="やりたいことリストへ移動"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteInboxItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  )
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
