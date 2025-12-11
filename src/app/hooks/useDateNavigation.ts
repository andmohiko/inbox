/**
 * 日付ナビゲーション用のカスタムフック
 *
 * 概要:
 * - 日付の表示フォーマットとナビゲーション機能を提供
 * - dayjsを使用して日付を処理
 *
 * 主な仕様:
 * - 日付文字列を表示用フォーマットに変換
 * - 日付の前後移動機能
 * - 本日の日付への移動機能
 *
 * 制限事項:
 * - 日付はYYYY-MM-DD形式の文字列として扱う
 */

import dayjs from 'dayjs'
import 'dayjs/locale/ja'

interface UseDateNavigationProps {
  /**
   * 現在の日付（YYYY-MM-DD形式の文字列）
   */
  currentDate: string
  /**
   * 日付変更時のコールバック関数
   *
   * @param date - 新しい日付（YYYY-MM-DD形式の文字列）
   */
  onDateChange: (date: string) => void
}

interface UseDateNavigationReturn {
  /**
   * 日付文字列を表示用フォーマットに変換
   *
   * @param dateStr - YYYY-MM-DD形式の日付文字列
   * @returns フォーマット済みの日付文字列
   */
  formatDisplayDate: (dateStr: string) => string
  /**
   * 日付を前後に移動
   *
   * @param direction - 移動方向（'prev' または 'next'）
   */
  navigateDate: (direction: 'prev' | 'next') => void
  /**
   * 本日の日付に移動
   */
  goToToday: () => void
}

/**
 * 日付ナビゲーション用のカスタムフック
 *
 * @param props - フックの設定
 * @returns 日付フォーマットとナビゲーション関数
 */
export function useDateNavigation({
  currentDate,
  onDateChange,
}: UseDateNavigationProps): UseDateNavigationReturn {
  /**
   * 日付文字列を表示用フォーマットに変換
   *
   * @param dateStr - YYYY-MM-DD形式の日付文字列
   * @returns フォーマット済みの日付文字列
   */
  const formatDisplayDate = (dateStr: string) => {
    const targetDate = dayjs(dateStr).locale('ja').startOf('day')
    const today = dayjs().startOf('day')
    const diffDays = targetDate.diff(today, 'day')
    // dayjsの日本語ロケールで曜日を1文字で取得（'dd'は短縮形の曜日名）
    const dayName = targetDate.format('dd')
    const dateStrFormatted = targetDate.format('M/D') + ` ${dayName}`

    if (diffDays === 0) return `今日 (${dateStrFormatted})`
    if (diffDays === 1) return `明日 (${dateStrFormatted})`
    if (diffDays === -1) return `昨日 (${dateStrFormatted})`

    return dateStrFormatted
  }

  /**
   * 日付を前後に移動
   *
   * @param direction - 移動方向（'prev' または 'next'）
   */
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = dayjs(currentDate)
      .add(direction === 'next' ? 1 : -1, 'day')
      .format('YYYY-MM-DD')
    onDateChange(newDate)
  }

  /**
   * 本日の日付に移動
   */
  const goToToday = () => {
    onDateChange(dayjs().format('YYYY-MM-DD'))
  }

  return {
    formatDisplayDate,
    navigateDate,
    goToToday,
  }
}
