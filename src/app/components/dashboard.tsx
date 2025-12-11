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
import { Header } from './header'
import { InboxColumn } from './inbox-column'
import { BacklogColumn } from './backlog-column'
import { getInboxItems } from '../actions/inbox'
import { getCurrentUser } from '@/lib/auth'
import dayjs from 'dayjs'

/**
 * Dashboardコンポーネント
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header email={user.email} name={user.name} />
      <main className="flex-1 px-4 pb-8 pt-4 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <InboxColumn initialItems={initialInboxItems} />
          <BacklogColumn />
        </div>
      </main>
    </div>
  )
}
