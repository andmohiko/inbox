'use client'

import type React from 'react'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Circle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { SortableItem } from './sortable-item'
import type { BacklogItem } from '@/types/item'
import { useBacklogItems } from '../hooks/useBacklogItems'

const statusConfig = {
  not_started: {
    label: '未着手',
    icon: Circle,
    className: 'text-muted-foreground',
  },
  in_progress: { label: '進行中', icon: Clock, className: 'text-blue-500' },
  completed: { label: '完了', icon: CheckCircle2, className: 'text-green-500' },
}

interface BacklogColumnProps {
  /**
   * 初期データ（Backlogアイテム）
   */
  initialItems: BacklogItem[]
}

export function BacklogColumn({ initialItems }: BacklogColumnProps) {
  // Backlogアイテム管理のカスタムフック
  const {
    backlogItems,
    addBacklogItem,
    deleteBacklogItem,
    reorderBacklogItems,
    moveToInbox,
    cycleStatus,
  } = useBacklogItems({
    initialItems,
  })

  // 新しいアイテムのタイトル入力
  const [newItemTitle, setNewItemTitle] = useState('')

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemTitle.trim()) {
      await addBacklogItem(newItemTitle.trim())
      setNewItemTitle('')
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
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            placeholder="やりたいことを追加..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newItemTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

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
                  const StatusIcon = statusConfig[item.status].icon
                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <div
                        className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                          item.status === 'completed' ? 'opacity-60' : ''
                        }`}
                      >
                        <button
                          onClick={() => cycleStatus(item)}
                          className={`flex-shrink-0 ${statusConfig[item.status].className}`}
                          title={statusConfig[item.status].label}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </button>
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
