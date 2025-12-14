/**
 * Dashboardコンポーネント
 *
 * 概要:
 * - アプリケーションのメイン画面
 * - InboxとBacklogの2カラムレイアウトを表示
 *
 * 主な仕様:
 * - Server Componentとして実装
 * - 認証状態を確認し、未認証の場合はログインページにリダイレクト
 * - 初期データ（本日のInboxアイテム）を取得
 * - クライアントコンポーネントにデータを渡す
 *
 * 制限事項:
 * - 認証済みユーザーのみアクセス可能
 */

import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'
import { getInboxItems } from '../actions/inbox'
import { getBacklogItems } from '../actions/backlog'
import { getCurrentUser } from '@/lib/auth'
import dayjs from 'dayjs'

/**
 * Dashboardコンポーネント
 *
 * Server Componentとして実装し、初期データを取得してClient Componentに渡す
 */
export async function Dashboard() {
  // 認証状態を確認
  const user = await getCurrentUser()

  // 未認証の場合はログインページにリダイレクト
  if (!user) {
    redirect('/login')
  }

  // 本日の日付を取得
  const today = dayjs().startOf('day').toDate()

  // 本日のInboxアイテムを取得（認証済みユーザーのIDはServer Action内で取得される）
  const initialInboxItems = await getInboxItems(today)

  // Backlogアイテムを取得（認証済みユーザーのIDはServer Action内で取得される）
  const initialBacklogItems = await getBacklogItems()

  return (
    <DashboardClient
      initialInboxItems={initialInboxItems}
      initialBacklogItems={initialBacklogItems}
      user={{ email: user.email, name: user.name }}
    />
  )
}
