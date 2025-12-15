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
import { Trash2, ArrowLeft } from 'lucide-react'
import { SortableItem } from './sortable-item'
import { StatusButton } from './status-button'
import { ItemCreationForm } from './item-creation-form'
import type { BacklogItem } from '@/types/item'
import { useBacklogItems } from '../hooks/useBacklogItems'
import { useEffect } from 'react'

interface BacklogColumnProps {
  /**
   * 初期データ（Backlogアイテム）
   */
  initialItems: BacklogItem[]
  /**
   * Inboxの再フェッチ関数（オプション）
   */
  onInboxRefresh?: () => Promise<void>
  /**
   * Backlogの再フェッチ関数を設定するコールバック
   */
  onBacklogRefreshRef?: (refreshFn: () => Promise<void>) => void
}

export function BacklogColumn({
  initialItems,
  onInboxRefresh,
  onBacklogRefreshRef,
}: BacklogColumnProps) {
  // Backlogアイテム管理のカスタムフック
  const {
    backlogItems,
    addBacklogItem,
    deleteBacklogItem,
    reorderBacklogItems,
    moveToInbox,
    cycleStatus,
    refreshBacklog,
    loadingItemIds,
  } = useBacklogItems({
    initialItems,
    onInboxRefresh,
  })

  // Backlogの再フェッチ関数を親コンポーネントに渡す
  useEffect(() => {
    if (onBacklogRefreshRef) {
      onBacklogRefreshRef(refreshBacklog)
    }
  }, [onBacklogRefreshRef, refreshBacklog])

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
      const oldIndex = backlogItems.findIndex((item) => item.id === active.id)
      const newIndex = backlogItems.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(backlogItems, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index,
        }),
      )

      reorderBacklogItems(reordered)
    }
  }

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
      <CardContent className="flex flex-1 flex-col gap-3">
        <ItemCreationForm
          placeholder="やりたいことを追加..."
          onCreateItem={addBacklogItem}
        />

        <div className="flex flex-1 flex-col gap-2">
          {backlogItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground">
              やりたいことを追加してください
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={backlogItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {backlogItems.map((item) => {
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
                            onClick={() => moveToInbox(item.id)}
                            title="本日のTodoへ移動"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteBacklogItem(item.id)}
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
