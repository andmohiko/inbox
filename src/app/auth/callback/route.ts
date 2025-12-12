/**
 * OAuth認証コールバックルート
 *
 * 概要:
 * - Google OAuth認証後のコールバックを処理
 * - 認証コードをセッションに交換
 * - ユーザー情報をPrismaのusersテーブルに保存
 * - 認証成功後、トップ画面にリダイレクト
 *
 * 主な仕様:
 * - Next.jsのRoute Handlerとして実装
 * - Supabaseの認証コールバックを処理
 * - 初回ログイン時またはユーザー情報更新時にPrismaのusersテーブルに保存
 * - エラー発生時はログインページにリダイレクト
 *
 * 制限事項:
 * - GETリクエストのみ処理
 * - サーバーサイドでのみ実行
 */

import { createClient } from '@/lib/supabase/server'
import { upsertUser } from '@/app/actions/user'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * アプリケーションのベースURLを取得
 * 環境変数が設定されている場合はそれを使用、未設定の場合はリクエストヘッダーから取得
 *
 * @param {NextRequest} request - Next.jsのリクエストオブジェクト
 * @returns {string} アプリケーションのベースURL
 */
function getAppUrl(request: NextRequest): string {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // リクエストヘッダーから実際のホストを取得
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'

  if (host) {
    // 本番環境では通常httpsを使用
    return `${protocol}://${host}`
  }

  // フォールバック: リクエストURLのオリジンを使用
  return new URL(request.url).origin
}

/**
 * OAuth認証コールバックを処理
 *
 * @param {NextRequest} request - Next.jsのリクエストオブジェクト
 * @returns {Promise<NextResponse>} リダイレクトレスポンス
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const appUrl = getAppUrl(request)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('認証コード交換エラー:', {
        functionName: 'GET',
        route: '/auth/callback',
        errorMessage: error.message,
        errorCode: error.status,
      })
      // エラー時はログインページにリダイレクト
      return NextResponse.redirect(new URL('/login?error=auth_failed', appUrl))
    }

    // 認証成功後、ユーザー情報をPrismaのusersテーブルに保存
    if (data.user) {
      try {
        await upsertUser({
          id: data.user.id,
          email: data.user.email || '',
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            undefined,
        })
      } catch (userError) {
        console.error('ユーザー情報保存エラー:', {
          functionName: 'GET',
          route: '/auth/callback',
          userId: data.user.id,
          error:
            userError instanceof Error ? userError.message : String(userError),
        })
        // ユーザー情報の保存に失敗しても認証は成功しているので、リダイレクトは続行
        // ただし、エラーログは記録
      }
    }
  }

  // 認証成功時はトップ画面にリダイレクト
  return NextResponse.redirect(new URL('/', appUrl))
}
