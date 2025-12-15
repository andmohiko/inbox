'use client'

import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Loader2 } from 'lucide-react'
import { useItemCreation } from '../hooks/useItemCreation'

interface ItemCreationFormProps {
  /**
   * プレースホルダーテキスト
   */
  placeholder: string
  /**
   * アイテム作成処理
   * @param title - アイテムのタイトル
   */
  onCreateItem: (title: string) => Promise<void>
}

/**
 * アイテム作成フォームコンポーネント
 *
 * 概要:
 * - タイトル入力と作成ボタンを提供
 * - ローディング状態を表示
 * - 重複クリックを防止
 *
 * 主な仕様:
 * - タイトルが空の場合はボタンを無効化
 * - 作成中はローディングアイコンを表示
 * - 作成中はボタンを無効化
 */
export function ItemCreationForm({
  placeholder,
  onCreateItem,
}: ItemCreationFormProps) {
  // アイテム作成用のカスタムフック
  const { title, setTitle, isCreating, handleSubmit } = useItemCreation({
    onCreateItem,
  })

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={!title.trim() || isCreating}>
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
