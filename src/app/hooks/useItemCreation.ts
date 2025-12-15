/**
 * アイテム作成用のカスタムフック
 *
 * 概要:
 * - アイテム作成時のローディング状態とフォーム状態を管理
 * - 重複クリックを防止し、ローディング中はボタンを無効化
 *
 * 主な仕様:
 * - タイトル入力の状態管理
 * - 作成中のローディング状態管理
 * - アイテム作成処理の実行
 *
 * 制限事項:
 * - 空のタイトルでは作成できない
 * - 作成中は重複実行を防止
 */

import { useState } from 'react'

interface UseItemCreationProps {
  /**
   * アイテム作成処理
   * @param title - アイテムのタイトル
   */
  onCreateItem: (title: string) => Promise<void>
}

interface UseItemCreationReturn {
  /**
   * 現在のタイトル入力値
   */
  title: string
  /**
   * タイトル入力値を更新
   */
  setTitle: (title: string) => void
  /**
   * 作成中かどうか
   */
  isCreating: boolean
  /**
   * フォーム送信ハンドラー
   */
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

/**
 * アイテム作成用のカスタムフック
 *
 * @param props - フックの設定
 * @returns アイテム作成に関する状態とハンドラー
 */
export function useItemCreation({
  onCreateItem,
}: UseItemCreationProps): UseItemCreationReturn {
  // タイトル入力の状態管理
  const [title, setTitle] = useState('')
  // 作成中のローディング状態
  const [isCreating, setIsCreating] = useState(false)

  /**
   * フォーム送信ハンドラー
   * タイトルが空でなく、作成中でない場合のみ実行
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && !isCreating) {
      setIsCreating(true)
      try {
        await onCreateItem(title.trim())
        setTitle('')
      } finally {
        setIsCreating(false)
      }
    }
  }

  return {
    title,
    setTitle,
    isCreating,
    handleSubmit,
  }
}
