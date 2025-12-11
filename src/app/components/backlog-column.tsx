"use client"

import type React from "react"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { SortableItem } from "./sortable-item"

export function BacklogColumn() {
  const backlogItems = []
  const addBacklogItem = () => {}
  const deleteBacklogItem = () => {}
  const moveToInbox = () => {}
  const reorderBacklogItems = () => {}
  const [newItemTitle, setNewItemTitle] = useState("")

  const sortedItems = [...backlogItems].sort((a, b) => a.order - b.order)

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
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
      const newIndex = sortedItems.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(sortedItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }))

      reorderBacklogItems(reordered)
    }
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemTitle.trim()) {
      addBacklogItem(newItemTitle.trim())
      setNewItemTitle("")
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Backlog</span>
          <span className="text-sm font-normal text-muted-foreground">{backlogItems.length}件</span>
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
          {sortedItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground">
              やりたいことを追加してください
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {sortedItems.map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    <div className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      {/* Starアイコン削除 */}
                      <span className="flex-1 text-sm">{item.title}</span>
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
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
