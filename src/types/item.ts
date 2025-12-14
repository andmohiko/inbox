/**
 * アイテム関連の型定義
 *
 * 概要:
 * - InboxとBacklogで使用するアイテムの型定義
 * - PrismaのItemモデルとUIで使用する型の変換処理
 *
 * 主な仕様:
 * - InboxItem: Inboxカラムで使用するTodoアイテムの型
 * - BacklogItem: Backlogカラムで使用するやりたいことアイテムの型
 * - ステータスの変換: PrismaのItemStatusとUIのステータス文字列を相互変換
 */

import { ItemStatus } from '@prisma/client'

/**
 * UIで使用するInboxアイテムのステータス
 */
export type InboxItemStatus = 'not_started' | 'in_progress' | 'completed'

/**
 * Inboxアイテムの型定義
 */
export interface InboxItem {
  /**
   * アイテムID
   */
  id: string

  /**
   * タスク名(タイトル)
   */
  title: string

  /**
   * ステータス
   */
  status: InboxItemStatus

  /**
   * 期日（日付文字列 YYYY-MM-DD形式）
   */
  date: string

  /**
   * 表示順序
   */
  order: number
}

/**
 * Backlogアイテムの型定義
 */
export interface BacklogItem {
  /**
   * アイテムID
   */
  id: string

  /**
   * タスク名(タイトル)
   */
  title: string

  /**
   * ステータス
   */
  status: InboxItemStatus

  /**
   * 表示順序
   */
  order: number
}

/**
 * PrismaのItemStatusをUIのステータス文字列に変換
 *
 * @param status - PrismaのItemStatus
 * @returns UIで使用するステータス文字列
 */
export function mapItemStatusToUI(status: ItemStatus): InboxItemStatus {
  switch (status) {
    case 'TODO':
      return 'not_started'
    case 'IN_PROGRESS':
    case 'IN_REVIEW':
      // IN_REVIEW（相手待ち）は暫定的にin_progressとして扱う
      return 'in_progress'
    case 'DONE':
      return 'completed'
    default:
      return 'not_started'
  }
}

/**
 * UIのステータス文字列をPrismaのItemStatusに変換
 *
 * @param status - UIで使用するステータス文字列
 * @returns PrismaのItemStatus
 */
export function mapUIToItemStatus(status: InboxItemStatus): ItemStatus {
  switch (status) {
    case 'not_started':
      return 'TODO'
    case 'in_progress':
      return 'IN_PROGRESS'
    case 'completed':
      return 'DONE'
    default:
      return 'TODO'
  }
}
