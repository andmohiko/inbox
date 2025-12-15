/**
 * Inbox関連のServer Actions
 *
 * 概要:
 * - Inbox（本日のTodoリスト）に関するデータベース操作を提供
 * - Server Actionsとして実装し、App Routerで使用
 *
 * 主な仕様:
 * - getInboxItems: 期日が今日のタスクはすべて取得、未完了で今日より前のタスクも取得
 * - addInboxItem: 新しいTodoを追加
 * - updateInboxItem: 既存のTodoを更新
 * - 削除されていないアイテム（deletedAtがnull）のみ取得
 * - orderで昇順ソート
 *
 * 制限事項:
 * - 認証済みユーザーのみ使用可能
 * - 認証状態はサーバー側で確認され、認証済みユーザーのIDのみ使用される
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { InboxItem, BacklogItem } from '@/types/item'
import { mapItemStatusToUI, mapUIToItemStatus } from '@/types/item'
import { getCurrentUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import dayjs from 'dayjs'

/**
 * Inboxアイテム（Todo）を取得
 *
 * 取得条件（表示日を基準）:
 * - 期日が表示日のタスクはすべて取得（完了/未完了問わず）
 * - 未完了のタスクで、期日が表示日より前のものはすべて取得
 * - 完了日が表示日のタスクはすべて取得（期日に関係なく、表示日分として表示）
 * - 期日が表示日の翌日以降のものは取得しない
 *
 * @param date - 表示する日付（DateオブジェクトまたはYYYY-MM-DD形式の文字列）
 * @returns InboxItemの配列
 * @throws 認証エラーまたはデータベースエラーが発生した場合
 */
export async function getInboxItems(date: Date | string): Promise<InboxItem[]> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // 表示日の開始時刻（00:00:00）と終了時刻（23:59:59）を計算
    const targetDate = dayjs(date)
    const displayDateStart = targetDate.startOf('day').toDate()
    const displayDateEnd = targetDate.endOf('day').toDate()

    // データベースからInboxアイテムを取得
    // 条件：
    // 1. 期日が表示日のタスクはすべて取得（完了/未完了問わず）
    // 2. 未完了のタスクで、期日が表示日より前のものはすべて取得
    // 3. 完了日が表示日のタスクはすべて取得（期日に関係なく、表示日分として表示）
    const items = await prisma.item.findMany({
      where: {
        userId,
        deletedAt: null, // 削除されていないアイテムのみ
        OR: [
          // 期日が表示日のタスク（すべて取得）
          {
            dueDate: {
              gte: displayDateStart,
              lte: displayDateEnd,
            },
          },
          // 期日が表示日より前で、未完了のタスク
          {
            dueDate: {
              lt: displayDateStart, // 表示日より前
            },
            status: {
              not: 'DONE', // 未完了（DONE以外）
            },
          },
          // 完了日が表示日のタスク（すべて取得、期日に関係なく）
          {
            completedAt: {
              gte: displayDateStart,
              lte: displayDateEnd,
            },
          },
        ],
      },
      orderBy: {
        order: 'asc', // orderで昇順ソート
      },
    })

    // PrismaのItemをInboxItemに変換
    const displayDateString = targetDate.format('YYYY-MM-DD')
    const inboxItems: InboxItem[] = items.map((item) => {
      // 完了日が表示日のタスクは表示日分として表示（表示日の日付を使用）
      // それ以外は期日（dueDate）を使用
      // 注: OR条件で既に完了日が表示日のタスクのみが取得されているため、
      // completedAtが存在する場合は表示日の日付を使用
      const dateString = item.completedAt
        ? displayDateString // 完了日が表示日の場合は表示日の日付（表示日分として表示）
        : item.dueDate
          ? dayjs(item.dueDate).format('YYYY-MM-DD')
          : displayDateString

      return {
        id: item.id,
        title: item.title,
        status: mapItemStatusToUI(item.status),
        date: dateString,
        order: item.order,
      }
    })

    return inboxItems
  } catch (error) {
    // エラーログを出力
    console.error('getInboxItems エラー:', {
      functionName: 'getInboxItems',
      date,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Inboxアイテムの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * 新しいInboxアイテム（Todo）を追加
 *
 * @param title - タスク名（必須）
 * @param dueDate - 期日（オプション、指定がない場合は本日）
 * @returns 作成されたInboxItem
 * @throws 認証エラー、バリデーションエラーまたはデータベースエラーが発生した場合
 */
export async function addInboxItem(
  title: string,
  dueDate?: Date | string,
): Promise<InboxItem> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id
    // バリデーション: タイトルが空でないことを確認
    if (!title || title.trim().length === 0) {
      throw new Error('タスク名は必須です')
    }

    // 期日が指定されていない場合は本日に設定
    const targetDueDate = dueDate
      ? dayjs(dueDate).startOf('day').toDate()
      : dayjs().startOf('day').toDate()

    // 指定日付の既存アイテムの最大orderを取得
    const startOfDay = dayjs(targetDueDate).startOf('day').toDate()
    const endOfDay = dayjs(targetDueDate).endOf('day').toDate()

    const existingItems = await prisma.item.findMany({
      where: {
        userId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deletedAt: null,
      },
      orderBy: {
        order: 'desc', // 降順でソートして最大値を取得
      },
      take: 1, // 最大値のみ取得
    })

    // 新しいorderを計算（既存の最大値+1、存在しない場合は0）
    const newOrder = existingItems.length > 0 ? existingItems[0].order + 1 : 0

    // 新しいアイテムを作成
    const newItem = await prisma.item.create({
      data: {
        userId,
        title: title.trim(),
        dueDate: targetDueDate,
        status: 'TODO', // デフォルトステータスは未着手
        order: newOrder,
      },
    })

    // 作成したアイテムをInboxItem形式に変換
    const dateString = dayjs(newItem.dueDate).format('YYYY-MM-DD')

    return {
      id: newItem.id,
      title: newItem.title,
      status: mapItemStatusToUI(newItem.status),
      date: dateString,
      order: newItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('addInboxItem エラー:', {
      functionName: 'addInboxItem',
      title,
      dueDate,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Inboxアイテムの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Inboxアイテム（Todo）を更新
 *
 * @param id - 更新するアイテムのID
 * @param updates - 更新する内容（title, status, date, orderのいずれか）
 * @returns 更新されたInboxItem
 * @throws 認証エラー、バリデーションエラーまたはデータベースエラーが発生した場合
 */
export async function updateInboxItem(
  id: string,
  updates: Partial<Pick<InboxItem, 'title' | 'status' | 'date' | 'order'>>,
): Promise<InboxItem> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // 更新データを準備
    const updateData: Prisma.ItemUpdateInput = {}

    // タイトルが指定されている場合は更新
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length === 0) {
        throw new Error('タスク名は必須です')
      }
      updateData.title = updates.title.trim()
    }

    // ステータスが指定されている場合は更新
    if (updates.status !== undefined) {
      const newStatus = mapUIToItemStatus(updates.status)
      updateData.status = newStatus

      // ステータスがDONE（完了）に変更された場合はcompletedAtを設定
      // それ以外のステータスに変更された場合はcompletedAtをnullにリセット
      if (newStatus === 'DONE') {
        updateData.completedAt = new Date() // 現在の日時を設定
      } else {
        // DONE以外のステータスに変更された場合はcompletedAtをクリア
        updateData.completedAt = null
      }
    }

    // 日付が指定されている場合は更新
    if (updates.date !== undefined) {
      updateData.dueDate = dayjs(updates.date).startOf('day').toDate()
    }

    // orderが指定されている場合は更新
    if (updates.order !== undefined) {
      updateData.order = updates.order
    }

    // アイテムが存在し、かつユーザーが所有していることを確認してから更新
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    })

    if (!existingItem) {
      throw new Error('アイテムが見つかりません')
    }

    // アイテムを更新
    const updatedItem = await prisma.item.update({
      where: {
        id,
      },
      data: updateData,
    })

    // 更新したアイテムをInboxItem形式に変換
    const dateString = updatedItem.dueDate
      ? dayjs(updatedItem.dueDate).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')

    return {
      id: updatedItem.id,
      title: updatedItem.title,
      status: mapItemStatusToUI(updatedItem.status),
      date: dateString,
      order: updatedItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('updateInboxItem エラー:', {
      functionName: 'updateInboxItem',
      id,
      updates,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Inboxアイテムの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * InboxアイテムをBacklog（やりたいことリスト）へ移動
 *
 * 主な仕様:
 * - 期日をnullに設定（Backlogアイテムになる）
 * - orderをBacklogの最大値+1に設定（スタック構造で上に追加）
 * - ステータスは保持される
 *
 * @param id - 移動するアイテムのID
 * @returns 移動後のBacklogItem
 * @throws 認証エラーまたはデータベースエラーが発生した場合
 */
export async function moveInboxToBacklog(id: string): Promise<BacklogItem> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // アイテムが存在し、かつユーザーが所有していることを確認
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
        dueDate: { not: null }, // Inboxアイテムのみ（期日が設定されている）
      },
    })

    if (!existingItem) {
      throw new Error('アイテムが見つかりません')
    }

    // Backlogアイテムの最大orderを取得
    const existingBacklogItems = await prisma.item.findMany({
      where: {
        userId,
        dueDate: null, // Backlogアイテムのみ
        deletedAt: null,
      },
      orderBy: {
        order: 'desc', // 降順でソートして最大値を取得
      },
      take: 1, // 最大値のみ取得
    })

    // 新しいorderを計算（既存の最大値+1、存在しない場合は0）
    const newOrder =
      existingBacklogItems.length > 0 ? existingBacklogItems[0].order + 1 : 0

    // アイテムを更新（期日をnullに設定、orderを更新）
    const updatedItem = await prisma.item.update({
      where: {
        id,
      },
      data: {
        dueDate: null, // 期日を削除してBacklogに移動
        order: newOrder, // Backlogの最大値+1に設定
      },
    })

    // 更新したアイテムをBacklogItem形式に変換
    return {
      id: updatedItem.id,
      title: updatedItem.title,
      status: mapItemStatusToUI(updatedItem.status),
      order: updatedItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('moveInboxToBacklog エラー:', {
      functionName: 'moveInboxToBacklog',
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `InboxからBacklogへの移動に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Inboxアイテム（Todo）を削除（ソフトデリート）
 *
 * 主な仕様:
 * - deletedAtフィールドに現在の日時を設定
 * - 物理削除ではなく論理削除（ソフトデリート）
 * - 削除後はリストに表示されなくなる
 *
 * @param id - 削除するアイテムのID
 * @throws 認証エラーまたはデータベースエラーが発生した場合
 */
export async function deleteInboxItem(id: string): Promise<void> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // アイテムが存在し、かつユーザーが所有していることを確認
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // 既に削除されていないアイテムのみ
      },
    })

    if (!existingItem) {
      throw new Error('アイテムが見つかりません')
    }

    // アイテムをソフトデリート（deletedAtを設定）
    await prisma.item.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(), // 削除日時を設定
      },
    })
  } catch (error) {
    // エラーログを出力
    console.error('deleteInboxItem エラー:', {
      functionName: 'deleteInboxItem',
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Inboxアイテムの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
