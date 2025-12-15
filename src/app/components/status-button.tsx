/**
 * ステータスアイコンボタンコンポーネント
 *
 * 概要:
 * - ステータスアイコンを表示し、クリックでステータスを循環させるボタン
 * - ローディング状態の表示も対応
 *
 * 主な仕様:
 * - ステータスに応じたアイコンと色を表示
 * - ローディング中はスピナーアイコンを表示
 * - クリックでステータスを循環
 */

'use client'

import { Loader2 } from 'lucide-react'
import { statusConfig } from '../utils/status'
import type { InboxItemStatus } from '@/types/item'

interface StatusButtonProps {
  /**
   * 現在のステータス
   */
  status: InboxItemStatus
  /**
   * ローディング中かどうか
   */
  isLoading?: boolean
  /**
   * クリック時のハンドラ
   */
  onClick: () => void
  /**
   * 追加のクラス名
   */
  className?: string
}

/**
 * ステータスアイコンボタンコンポーネント
 *
 * @param props - コンポーネントのプロパティ
 * @returns ステータスアイコンボタン
 */
export function StatusButton({
  status,
  isLoading = false,
  onClick,
  className = '',
}: StatusButtonProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex-shrink-0 ${config.className} ${isLoading ? 'opacity-50' : ''} ${className}`}
      title={config.label}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <StatusIcon className="h-5 w-5" />
      )}
    </button>
  )
}
