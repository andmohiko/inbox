/**
 * Supabaseクライアント（サーバー用）
 *
 * 概要:
 * - サーバーコンポーネントやServer Actionsで使用するSupabaseクライアント
 * - クッキーからセッション情報を取得して認証状態を管理
 *
 * 主な仕様:
 * - createServerClientを使用してサーバーインスタンスを作成
 * - Next.jsのcookies()を使用してクッキーを管理
 *
 * 制限事項:
 * - サーバー環境でのみ使用可能
 * - 環境変数が設定されていない場合はエラーをスロー
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * SupabaseのURL
 * 環境変数から取得、未設定の場合はエラー
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

/**
 * SupabaseのAnon Key
 * 環境変数から取得、未設定の場合はエラー
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * サーバー用Supabaseクライアントを取得
 * クッキーからセッション情報を読み取り、認証状態を管理
 *
 * @returns {Promise<ReturnType<typeof createServerClient>>} Supabaseクライアントインスタンス
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: any) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // サーバーコンポーネントでのクッキー設定は制限がある場合がある
          // その場合はエラーを無視（クライアント側で設定される）
        }
      },
    },
  })
}
