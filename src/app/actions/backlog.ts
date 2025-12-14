/**
 * Backlog関連のServer Actions
 *
 * 概要:
 * - Backlog（やりたいことリスト）に関するデータベース操作を提供
 * - Server Actionsとして実装し、App Routerで使用
 *
 * 主な仕様:
 * - getBacklogItems: 期限のないアイテム（dueDateがnull）を取得
 * - addBacklogItem: 新しいBacklogアイテムを追加
 * - 削除されていないアイテム（deletedAtがnull）のみ取得
 * - orderで降順ソート（スタック構造：新しく追加したものが上）
 *
 * 制限事項:
 * - 認証済みユーザーのみ使用可能
 * - 認証状態はサーバー側で確認され、認証済みユーザーのIDのみ使用される
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { BacklogItem } from '@/types/item'
import type { InboxItem } from '@/types/item'
import { mapItemStatusToUI, mapUIToItemStatus } from '@/types/item'
import { getCurrentUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import dayjs from 'dayjs'

/**
 * Backlogアイテム（やりたいことリスト）を取得
 *
 * 取得条件:
 * - dueDateがnullのアイテム（期限のないアイテム）
 * - 削除されていないアイテム（deletedAtがnull）
 * - orderで降順ソート（スタック構造：新しく追加したものが上）
 *
 * @returns BacklogItemの配列
 * @throws 認証エラーまたはデータベースエラーが発生した場合
 */
export async function getBacklogItems(): Promise<BacklogItem[]> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // データベースからBacklogアイテムを取得
    const items = await prisma.item.findMany({
      where: {
        userId,
        dueDate: null, // 期限のないアイテムのみ
        deletedAt: null, // 削除されていないアイテムのみ
      },
      orderBy: {
        order: 'desc', // orderで降順ソート（スタック構造）
      },
    })

    // PrismaのItemをBacklogItemに変換
    const backlogItems: BacklogItem[] = items.map((item) => {
      return {
        id: item.id,
        title: item.title,
        status: mapItemStatusToUI(item.status),
        order: item.order,
      }
    })

    return backlogItems
  } catch (error) {
    // エラーログを出力
    console.error('getBacklogItems エラー:', {
      functionName: 'getBacklogItems',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Backlogアイテムの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * 新しいBacklogアイテム（やりたいこと）を追加
 *
 * 主な仕様:
 * - 期日は設定されない（dueDateはnull）
 * - 新しく追加したアイテムは一番上に表示される（スタック構造）
 * - orderは既存の最大値+1を設定
 *
 * @param title - タスク名（必須）
 * @returns 作成されたBacklogItem
 * @throws 認証エラー、バリデーションエラーまたはデータベースエラーが発生した場合
 */
export async function addBacklogItem(title: string): Promise<BacklogItem> {
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

    // 既存のBacklogアイテムの最大orderを取得
    const existingItems = await prisma.item.findMany({
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
    const newOrder = existingItems.length > 0 ? existingItems[0].order + 1 : 0

    // 新しいアイテムを作成
    const newItem = await prisma.item.create({
      data: {
        userId,
        title: title.trim(),
        dueDate: null, // Backlogアイテムは期日なし
        status: 'TODO', // デフォルトステータス（Backlogでは使用されないが、DB制約のため必要）
        order: newOrder,
      },
    })

    // 作成したアイテムをBacklogItem形式に変換
    return {
      id: newItem.id,
      title: newItem.title,
      status: mapItemStatusToUI(newItem.status),
      order: newItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('addBacklogItem エラー:', {
      functionName: 'addBacklogItem',
      title,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Backlogアイテムの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Backlogアイテム（やりたいこと）を更新
 *
 * @param id - 更新するアイテムのID
 * @param updates - 更新する内容（title, status, orderのいずれか）
 * @returns 更新されたBacklogItem
 * @throws 認証エラー、バリデーションエラーまたはデータベースエラーが発生した場合
 */
export async function updateBacklogItem(
  id: string,
  updates: Partial<Pick<BacklogItem, 'title' | 'status' | 'order'>>,
): Promise<BacklogItem> {
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
      updateData.status = mapUIToItemStatus(updates.status)
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
        dueDate: null, // Backlogアイテムのみ
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

    // 更新したアイテムをBacklogItem形式に変換
    return {
      id: updatedItem.id,
      title: updatedItem.title,
      status: mapItemStatusToUI(updatedItem.status),
      order: updatedItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('updateBacklogItem エラー:', {
      functionName: 'updateBacklogItem',
      id,
      updates,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `Backlogアイテムの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * BacklogアイテムをInbox（本日のTodo）へ移動
 *
 * 主な仕様:
 * - 期日を本日に設定（Inboxアイテムになる）
 * - orderをInboxの最大値+1に設定（キュー構造で下に追加）
 * - ステータスをTODO（未着手）にリセット
 *
 * @param id - 移動するアイテムのID
 * @param dueDate - 期日（オプション、指定がない場合は本日）
 * @returns 移動後のInboxItem
 * @throws 認証エラーまたはデータベースエラーが発生した場合
 */
export async function moveBacklogToInbox(
  id: string,
  dueDate?: Date | string,
): Promise<InboxItem> {
  try {
    // 認証状態を確認し、認証済みユーザーのIDを取得
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }
    const userId = user.id

    // 期日が指定されていない場合は本日に設定
    const targetDueDate = dueDate
      ? dayjs(dueDate).startOf('day').toDate()
      : dayjs().startOf('day').toDate()

    // アイテムが存在し、かつユーザーが所有していることを確認
    const existingItem = await prisma.item.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
        dueDate: null, // Backlogアイテムのみ（期日がnull）
      },
    })

    if (!existingItem) {
      throw new Error('アイテムが見つかりません')
    }

    // 指定日付のInboxアイテムの最大orderを取得
    const startOfDay = dayjs(targetDueDate).startOf('day').toDate()
    const endOfDay = dayjs(targetDueDate).endOf('day').toDate()

    const existingInboxItems = await prisma.item.findMany({
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
    const newOrder =
      existingInboxItems.length > 0 ? existingInboxItems[0].order + 1 : 0

    // アイテムを更新（期日を設定、orderを更新、ステータスをTODOにリセット）
    const updatedItem = await prisma.item.update({
      where: {
        id,
      },
      data: {
        dueDate: targetDueDate, // 期日を設定してInboxに移動
        order: newOrder, // Inboxの最大値+1に設定
        status: 'TODO', // ステータスを未着手にリセット
        completedAt: null, // 完了日時をクリア
      },
    })

    // 更新したアイテムをInboxItem形式に変換
    const dateString = dayjs(updatedItem.dueDate).format('YYYY-MM-DD')

    return {
      id: updatedItem.id,
      title: updatedItem.title,
      status: mapItemStatusToUI(updatedItem.status),
      date: dateString,
      order: updatedItem.order,
    }
  } catch (error) {
    // エラーログを出力
    console.error('moveBacklogToInbox エラー:', {
      functionName: 'moveBacklogToInbox',
      id,
      dueDate,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // エラーを再スロー
    throw new Error(
      `BacklogからInboxへの移動に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
