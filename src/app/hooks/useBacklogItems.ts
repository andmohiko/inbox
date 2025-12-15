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
  moveBacklogToInbox as moveBacklogToInboxAction,
} from '../actions/backlog'

interface UseBacklogItemsProps {
  /**
   * 初期データ（Server Componentから渡されたBacklogアイテム）
   */
  initialItems: BacklogItem[]
  /**
   * Inboxの再フェッチ関数（オプション）
   * アイテムをInboxに移動した際に呼び出される
   */
  onInboxRefresh?: () => Promise<void>
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
  cycleStatus: (item: BacklogItem) => Promise<void>
  /**
   * Backlogのデータを再取得
   */
  refreshBacklog: () => Promise<void>
  /**
   * ローディング中のアイテムIDのセット
   */
  loadingItemIds: Set<string>
}

/**
 * Backlogアイテム管理用のカスタムフック
 *
 * @param props - フックの初期値
 * @returns Backlogアイテムの状態と操作関数
 */
export function useBacklogItems({
  initialItems,
  onInboxRefresh,
}: UseBacklogItemsProps): UseBacklogItemsReturn {
  // Backlogアイテムの状態管理（初期値はServer Componentから受け取ったデータ）
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>(initialItems)
  // ローディング中のアイテムIDを管理
  const [loadingItemIds, setLoadingItemIds] = useState<Set<string>>(new Set())

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
   * BacklogアイテムをInboxへ移動
   *
   * @param id - 移動するアイテムのID
   */
  const moveToInbox = async (id: string) => {
    try {
      // Server Actionを呼び出してアイテムをInboxに移動（期日は本日に設定）
      await moveBacklogToInboxAction(id)

      // 移動後はBacklogのデータを再取得（移動したアイテムはBacklogから消える）
      const items = await getBacklogItems()
      setBacklogItems(items)

      // Inboxのデータも再取得
      if (onInboxRefresh) {
        await onInboxRefresh()
      }
    } catch (error) {
      console.error('BacklogからInboxへの移動に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * Backlogアイテムのステータスを循環させる
   * 未着手 → 進行中 → 完了 → 未着手 の順で循環
   * オプティミスティックUI更新を実装し、即座に画面に反映
   *
   * @param item - ステータスを変更するアイテム
   */
  const cycleStatus = async (item: BacklogItem): Promise<void> => {
    const statusOrder: BacklogItem['status'][] = [
      'not_started',
      'in_progress',
      'completed',
    ]
    const currentIndex = statusOrder.indexOf(item.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    // 現在の状態を保存（エラー時にロールバックするため）
    const previousItem = item

    // ローディング状態を開始
    setLoadingItemIds((prev) => new Set(prev).add(item.id))

    // オプティミスティックUI更新：即座にローカル状態を更新
    setBacklogItems((prevItems) =>
      prevItems.map((i) =>
        i.id === item.id ? { ...i, status: nextStatus } : i,
      ),
    )

    try {
      // Server Actionを呼び出してアイテムを更新
      const updatedItem = await updateBacklogItemAction(item.id, {
        status: nextStatus,
      })

      // サーバーから返された最新の状態で更新
      setBacklogItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? updatedItem : i)),
      )
    } catch (error) {
      // エラーが発生した場合は、元の状態にロールバック
      console.error('Backlogアイテムのステータス更新に失敗しました:', error)
      setBacklogItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? previousItem : i)),
      )
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    } finally {
      // ローディング状態を解除
      setLoadingItemIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  /**
   * Backlogのデータを再取得
   */
  const refreshBacklog = async () => {
    try {
      const items = await getBacklogItems()
      setBacklogItems(items)
    } catch (error) {
      console.error('Backlogアイテムの取得に失敗しました:', error)
    }
  }

  return {
    backlogItems,
    addBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
    reorderBacklogItems,
    moveToInbox,
    cycleStatus,
    refreshBacklog,
    loadingItemIds,
  }
}
