/**
 * ログインページコンポーネント
 *
 * 概要:
 * - Google認証によるログイン画面
 * - Supabaseを使用したOAuth認証を実装
 *
 * 主な仕様:
 * - Googleログインボタンを表示
 * - ログイン成功後、トップ画面にリダイレクト
 * - ローディング状態を表示
 *
 * 制限事項:
 * - クライアントコンポーネントとして実装
 * - 環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が必要
 */

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * ログインページコンポーネント
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Googleログインを実行
   * SupabaseのOAuth認証を使用してGoogleアカウントでログイン
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Googleログインエラー:', {
          functionName: 'handleGoogleSignIn',
          errorMessage: error.message,
          errorCode: error.status,
        })
        alert(`ログインに失敗しました: ${error.message}`)
      }
    } catch (error) {
      console.error('予期しないエラー:', {
        functionName: 'handleGoogleSignIn',
        error: error instanceof Error ? error.message : String(error),
      })
      alert('予期しないエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="mt-2 text-muted-foreground">
            タスクを整理して、やりたいことを実現しよう
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>ログイン</CardTitle>
            <CardDescription>
              Googleアカウントでログインしてください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-3 bg-transparent"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? 'ログイン中...' : 'Googleでログイン'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
