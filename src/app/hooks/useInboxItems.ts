/**
 * Inboxアイテム管理用のカスタムフック
 *
 * 概要:
 * - Inboxアイテムの状態管理と操作を提供
 * - Server Actionsを使用してデータを取得・更新
 *
 * 主な仕様:
 * - 初期データを受け取り、状態を管理
 * - 日付変更時にデータを再取得
 * - アイテムの追加、更新、削除、並び替えの機能を提供
 *
 * 制限事項:
 * - 認証済みユーザーのみ使用可能（Server Action内で認証チェック）
 */

import { useState, useMemo } from 'react'
import type { InboxItem } from '@/types/item'
import {
  getInboxItems,
  addInboxItem as addInboxItemAction,
  updateInboxItem as updateInboxItemAction,
  moveInboxToBacklog as moveInboxToBacklogAction,
} from '../actions/inbox'
import dayjs from 'dayjs'
import { getNextStatus } from '../utils/status'

interface UseInboxItemsProps {
  /**
   * 初期データ（Server Componentから渡されたInboxアイテム）
   */
  initialItems: InboxItem[]
  /**
   * 初期日付（YYYY-MM-DD形式の文字列）
   */
  initialDate: string
  /**
   * Backlogの再フェッチ関数（オプション）
   * アイテムをBacklogに移動した際に呼び出される
   */
  onBacklogRefresh?: () => Promise<void>
}

interface UseInboxItemsReturn {
  /**
   * 現在の日付（YYYY-MM-DD形式の文字列）
   */
  currentDate: string
  /**
   * 現在の日付のInboxアイテムリスト（ソート済み）
   */
  currentItems: InboxItem[]
  /**
   * 日付を変更し、該当日付のデータを取得
   *
   * @param date - 変更先の日付（YYYY-MM-DD形式の文字列）
   */
  changeDateAndFetch: (date: string) => Promise<void>
  /**
   * 新しいInboxアイテムを追加
   *
   * @param title - タスク名
   */
  addInboxItem: (title: string) => Promise<void>
  /**
   * Inboxアイテムを更新
   */
  updateInboxItem: (id: string, item: Partial<InboxItem>) => Promise<void>
  /**
   * Inboxアイテムを削除（TODO: 実装予定）
   */
  deleteInboxItem: (id: string) => void
  /**
   * Inboxアイテムの並び順を変更（TODO: 実装予定）
   */
  reorderInboxItems: (items: InboxItem[]) => void
  /**
   * Inboxアイテムをやりたいことリストへ移動（TODO: 実装予定）
   */
  moveToWantToDo: (id: string) => void
  /**
   * Inboxアイテムのステータスを循環させる
   */
  cycleStatus: (item: InboxItem) => Promise<void>
  /**
   * Inboxのデータを再取得（現在の日付）
   */
  refreshInbox: () => Promise<void>
  /**
   * ローディング中のアイテムIDのセット
   */
  loadingItemIds: Set<string>
}

/**
 * Inboxアイテム管理用のカスタムフック
 *
 * @param props - フックの初期値
 * @returns Inboxアイテムの状態と操作関数
 */
export function useInboxItems({
  initialItems,
  initialDate,
  onBacklogRefresh,
}: UseInboxItemsProps): UseInboxItemsReturn {
  // 現在の日付をYYYY-MM-DD形式の文字列で管理
  const [currentDate, setCurrentDate] = useState<string>(initialDate)

  // Inboxアイテムの状態管理（初期値はServer Componentから受け取ったデータ）
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(initialItems)
  // ローディング中のアイテムIDを管理
  const [loadingItemIds, setLoadingItemIds] = useState<Set<string>>(new Set())

  /**
   * 指定日付に移動し、該当日付のデータを取得
   *
   * @param date - 移動先の日付（YYYY-MM-DD形式の文字列）
   */
  const changeDateAndFetch = async (date: string) => {
    setCurrentDate(date)
    try {
      const items = await getInboxItems(date)
      setInboxItems(items)
    } catch (error) {
      console.error('Inboxアイテムの取得に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * 新しいInboxアイテムを追加
   *
   * @param title - タスク名
   */
  const addInboxItem = async (title: string) => {
    try {
      const dueDate = dayjs(currentDate).toDate()
      await addInboxItemAction(title, dueDate)
      // 追加後は常に最新データを再取得（シンプルで確実）
      await changeDateAndFetch(currentDate)
    } catch (error) {
      console.error('Inboxアイテムの追加に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * Inboxアイテムを更新
   *
   * @param id - 更新するアイテムのID
   * @param item - 更新する内容
   */
  const updateInboxItem = async (
    id: string,
    item: Partial<InboxItem>,
  ): Promise<void> => {
    try {
      // Server Actionを呼び出してアイテムを更新
      const updatedItem = await updateInboxItemAction(id, item)

      // 更新後のアイテムが現在表示中の日付のものか確認
      const currentItem = inboxItems.find((i) => i.id === id)
      if (currentItem && updatedItem.date === currentItem.date) {
        // 同じ日付のアイテムなので、状態を更新
        setInboxItems((prevItems) =>
          prevItems.map((i) => (i.id === id ? updatedItem : i)),
        )
      } else {
        // 別の日付のアイテムになった、または日付が変わった場合はデータを再取得
        await changeDateAndFetch(currentDate)
      }
    } catch (error) {
      console.error('Inboxアイテムの更新に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * Inboxアイテムを削除（TODO: 実装予定）
   *
   * @param id - 削除するアイテムのID
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteInboxItem = (id: string) => {
    // TODO: 実装予定
  }

  /**
   * Inboxアイテムの並び順を変更（TODO: 実装予定）
   *
   * @param items - 新しい並び順のアイテムリスト
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reorderInboxItems = (items: InboxItem[]) => {
    // TODO: 実装予定
  }

  /**
   * Inboxアイテムをやりたいことリストへ移動
   *
   * @param id - 移動するアイテムのID
   */
  const moveToWantToDo = async (id: string) => {
    try {
      // Server Actionを呼び出してアイテムをBacklogに移動
      await moveInboxToBacklogAction(id)

      // 移動後は現在の日付のデータを再取得（移動したアイテムはInboxから消える）
      await changeDateAndFetch(currentDate)

      // Backlogのデータも再取得
      if (onBacklogRefresh) {
        await onBacklogRefresh()
      }
    } catch (error) {
      console.error('InboxからBacklogへの移動に失敗しました:', error)
      // TODO: エラーメッセージをユーザーに表示する処理を追加
    }
  }

  /**
   * Inboxアイテムのステータスを循環させる
   * 未着手 → 進行中 → 完了 → 未着手 の順で循環
   * オプティミスティックUI更新を実装し、即座に画面に反映
   *
   * @param item - ステータスを変更するアイテム
   */
  const cycleStatus = async (item: InboxItem): Promise<void> => {
    const nextStatus = getNextStatus(item.status)

    // 現在の状態を保存（エラー時にロールバックするため）
    const previousItem = item

    // ローディング状態を開始
    setLoadingItemIds((prev) => new Set(prev).add(item.id))

    // オプティミスティックUI更新：即座にローカル状態を更新
    setInboxItems((prevItems) =>
      prevItems.map((i) =>
        i.id === item.id ? { ...i, status: nextStatus } : i,
      ),
    )

    try {
      // Server Actionを呼び出してアイテムを更新
      const updatedItem = await updateInboxItemAction(item.id, {
        status: nextStatus,
      })

      // 更新後のアイテムが現在表示中の日付のものか確認
      const currentItem = inboxItems.find((i) => i.id === item.id)
      if (currentItem && updatedItem.date === currentItem.date) {
        // 同じ日付のアイテムなので、サーバーから返された最新の状態で更新
        setInboxItems((prevItems) =>
          prevItems.map((i) => (i.id === item.id ? updatedItem : i)),
        )
      } else {
        // 別の日付のアイテムになった、または日付が変わった場合はデータを再取得
        await changeDateAndFetch(currentDate)
      }
    } catch (error) {
      // エラーが発生した場合は、元の状態にロールバック
      console.error('Inboxアイテムのステータス更新に失敗しました:', error)
      setInboxItems((prevItems) =>
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

  // ソート済みのアイテムリスト（メモ化してパフォーマンス最適化）
  const currentItems = useMemo(
    () => [...inboxItems].sort((a, b) => a.order - b.order),
    [inboxItems],
  )

  /**
   * Inboxのデータを再取得（現在の日付）
   */
  const refreshInbox = async () => {
    await changeDateAndFetch(currentDate)
  }

  return {
    currentDate,
    currentItems,
    changeDateAndFetch,
    addInboxItem,
    updateInboxItem,
    deleteInboxItem,
    reorderInboxItems,
    moveToWantToDo,
    cycleStatus,
    refreshInbox,
    loadingItemIds,
  }
}
