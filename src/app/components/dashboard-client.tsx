/**
 * Dashboard Client Component
 *
 * 概要:
 * - Dashboardのクライアント側の実装
 * - InboxとBacklogのコンポーネント間でコールバックを共有
 *
 * 主な仕様:
 * - Client Componentとして実装
 * - InboxとBacklogの再フェッチ関数を相互に渡す
 */

'use client'

import { useRef } from 'react'
import { Header } from './header'
import { InboxColumn } from './inbox-column'
import { BacklogColumn } from './backlog-column'
import type { InboxItem, BacklogItem } from '@/types/item'

interface DashboardClientProps {
  /**
   * 初期データ（本日のInboxアイテム）
   */
  initialInboxItems: InboxItem[]
  /**
   * 初期データ（Backlogアイテム）
   */
  initialBacklogItems: BacklogItem[]
  /**
   * ユーザー情報
   */
  user: {
    email: string
    name: string | null
  }
}

export function DashboardClient({
  initialInboxItems,
  initialBacklogItems,
  user,
}: DashboardClientProps) {
  // InboxとBacklogの再フェッチ関数を保持するためのref
  const inboxRefreshRef = useRef<(() => Promise<void>) | null>(null)
  const backlogRefreshRef = useRef<(() => Promise<void>) | null>(null)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header email={user.email} name={user.name ?? undefined} />
      <main className="flex-1 px-4 pb-8 pt-4 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <InboxColumn
            initialItems={initialInboxItems}
            onBacklogRefresh={async () => {
              if (backlogRefreshRef.current) {
                await backlogRefreshRef.current()
              }
            }}
            onInboxRefreshRef={(refreshFn) => {
              inboxRefreshRef.current = refreshFn
            }}
          />
          <BacklogColumn
            initialItems={initialBacklogItems}
            onInboxRefresh={async () => {
              if (inboxRefreshRef.current) {
                await inboxRefreshRef.current()
              }
            }}
            onBacklogRefreshRef={(refreshFn) => {
              backlogRefreshRef.current = refreshFn
            }}
          />
        </div>
      </main>
    </div>
  )
}
