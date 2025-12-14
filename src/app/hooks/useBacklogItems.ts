/**
 * Backlogアイテム管理用のカスタムフック
 *
 * 概要:
 * - Backlogアイテムの状態管理と操作を提供
 * - Server Actionsを使用してデータを取得・更新
 *
 * 主な仕様:
 * - 初期データを受け取り、状態を管理
 * - アイテムの追加機能を提供
 * - スタック構造（新しく追加したものが上 = order降順）
 *
 * 制限事項:
 * - 認証済みユーザーのみ使用可能（Server Action内で認証チェック）
 */

import { useState } from 'react'
import type { BacklogItem } from '@/types/item'
import {
  getBacklogItems,
  addBacklogItem as addBacklogItemAction,
  updateBacklogItem as updateBacklogItemAction,
} from '../actions/backlog'

interface UseBacklogItemsProps {
  /**
   * 初期データ（Server Componentから渡されたBacklogアイテム）
   */
  initialItems: BacklogItem[]
}

interface UseBacklogItemsReturn {
  /**
   * 現在のBacklogアイテムリスト（ソート済み）
   */
  backlogItems: BacklogItem[]
  /**
   * 新しいBacklogアイテムを追加
   *
   * @param title - タスク名
   */
  addBacklogItem: (title: string) => Promise<void>
  /**
   * Backlogアイテムを更新
   */
  updateBacklogItem: (id: string, item: Partial<BacklogItem>) => Promise<void>
  /**
   * Backlogアイテムを削除（TODO: 実装予定）
   */
  deleteBacklogItem: (id: string) => void
  /**
   * Backlogアイテムの並び順を変更（TODO: 実装予定）
   */
  reorderBacklogItems: (items: BacklogItem[]) => void
  /**
   * BacklogアイテムをInboxへ移動（TODO: 実装予定）
   */
  moveToInbox: (id: string) => void
  /**
   * Backlogアイテムのステータスを循環させる
   */
  cycleStatus: (item: BacklogItem) => void
}

/**
 * Backlogアイテム管理用のカスタムフック
 *
 * @param props - フックの初期値
 * @returns Backlogアイテムの状態と操作関数
 */
export function useBacklogItems({
  initialItems,
}: UseBacklogItemsProps): UseBacklogItemsReturn {
  // Backlogアイテムの状態管理（初期値はServer Componentから受け取ったデータ）
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>(initialItems)

  /**
   * 新しいBacklogアイテムを追加
   *
   * @param title - タスク名
   */
  const addBacklogItem = async (title: string) => {
    try {
      // Server Actionを呼び出してアイテムを追加
      await addBacklogItemAction(title)

      // 追加後は常に最新データを再取得（シンプルで確実）
      const items = await getBacklogItems()
      setBacklogItems(items)
    } catch (error) {
      console.error('Backlogアイテムの追加に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * Backlogアイテムを削除（TODO: 実装予定）
   *
   * @param id - 削除するアイテムのID
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteBacklogItem = (id: string) => {
    // TODO: 実装予定
  }

  /**
   * Backlogアイテムの並び順を変更（TODO: 実装予定）
   *
   * @param items - 新しい並び順のアイテムリスト
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reorderBacklogItems = (items: BacklogItem[]) => {
    // TODO: 実装予定
  }

  /**
   * Backlogアイテムを更新
   *
   * @param id - 更新するアイテムのID
   * @param item - 更新する内容
   */
  const updateBacklogItem = async (
    id: string,
    item: Partial<BacklogItem>,
  ): Promise<void> => {
    try {
      // Server Actionを呼び出してアイテムを更新
      const updatedItem = await updateBacklogItemAction(id, item)

      // 状態を更新
      setBacklogItems((prevItems) =>
        prevItems.map((i) => (i.id === id ? updatedItem : i)),
      )
    } catch (error) {
      console.error('Backlogアイテムの更新に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * BacklogアイテムをInboxへ移動（TODO: 実装予定）
   *
   * @param id - 移動するアイテムのID
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const moveToInbox = (id: string) => {
    // TODO: 実装予定
  }

  /**
   * Backlogアイテムのステータスを循環させる
   * 未着手 → 進行中 → 完了 → 未着手 の順で循環
   *
   * @param item - ステータスを変更するアイテム
   */
  const cycleStatus = (item: BacklogItem) => {
    const statusOrder: BacklogItem['status'][] = [
      'not_started',
      'in_progress',
      'completed',
    ]
    const currentIndex = statusOrder.indexOf(item.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
    updateBacklogItem(item.id, { status: nextStatus })
  }

  return {
    backlogItems,
    addBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
    reorderBacklogItems,
    moveToInbox,
    cycleStatus,
  }
}
