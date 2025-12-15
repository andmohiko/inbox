/**
 * ステータス関連のユーティリティ関数
 *
 * 概要:
 * - ステータスの設定と循環ロジックを提供
 * - InboxとBacklogで共通して使用
 *
 * 主な仕様:
 * - ステータスの表示設定（ラベル、アイコン、クラス名）
 * - ステータスの循環順序を定義
 * - 次のステータスを計算する関数
 */

import { Circle, Clock, CheckCircle2, type LucideIcon } from 'lucide-react'
import type { InboxItemStatus } from '@/types/item'

/**
 * ステータスの表示設定
 */
export const statusConfig: Record<
  InboxItemStatus,
  {
    label: string
    icon: LucideIcon
    className: string
  }
> = {
  not_started: {
    label: '未着手',
    icon: Circle,
    className: 'text-muted-foreground',
  },
  in_progress: {
    label: '進行中',
    icon: Clock,
    className: 'text-blue-500',
  },
  completed: {
    label: '完了',
    icon: CheckCircle2,
    className: 'text-green-500',
  },
}

/**
 * ステータスの循環順序
 */
const statusOrder: InboxItemStatus[] = [
  'not_started',
  'in_progress',
  'completed',
]

/**
 * 次のステータスを取得する
 * 未着手 → 進行中 → 完了 → 未着手 の順で循環
 *
 * @param currentStatus - 現在のステータス
 * @returns 次のステータス
 */
export function getNextStatus(currentStatus: InboxItemStatus): InboxItemStatus {
  const currentIndex = statusOrder.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % statusOrder.length
  return statusOrder[nextIndex]
}
