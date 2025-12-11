/**
 * Headerコンポーネント
 *
 * 概要:
 * - アプリケーションのヘッダー部分
 * - ユーザー情報の表示とログアウト機能を提供
 *
 * 主な仕様:
 * - クライアントコンポーネントとして実装
 * - ユーザーのメールアドレスを表示
 * - ログアウトボタンでセッションを終了
 *
 * 制限事項:
 * - 認証済みユーザーのみ表示される想定
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { signOut } from '../actions/auth'

/**
 * HeaderコンポーネントのProps
 */
interface HeaderProps {
  /**
   * ユーザーのメールアドレス
   */
  email: string
  /**
   * ユーザー名（任意）
   */
  name?: string
}

/**
 * Headerコンポーネント
 *
 * @param {HeaderProps} props - コンポーネントのProps
 */
export function Header({ email, name }: HeaderProps) {
  /**
   * ログアウト処理を実行
   */
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', {
        functionName: 'handleLogout',
        error: error instanceof Error ? error.message : String(error),
      })
      alert('ログアウトに失敗しました')
    }
  }

  const displayName = name || email

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Inbox</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
