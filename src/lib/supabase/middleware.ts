/**
 * Supabaseクライアント（ミドルウェア用）
 *
 * 概要:
 * - Next.jsのミドルウェアで使用するSupabaseクライアント
 * - リクエスト/レスポンスのクッキーを管理して認証状態を維持
 *
 * 主な仕様:
 * - createServerClientを使用してミドルウェア用インスタンスを作成
 * - RequestとResponseオブジェクトからクッキーを取得・設定
 *
 * 制限事項:
 * - ミドルウェア環境でのみ使用可能
 * - 環境変数が設定されていない場合はエラーをスロー
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
 * ミドルウェア用Supabaseクライアントを取得
 * リクエスト/レスポンスからクッキーを管理
 *
 * @param {NextRequest} request - Next.jsのリクエストオブジェクト
 * @param {NextResponse} response - Next.jsのレスポンスオブジェクト
 * @returns {ReturnType<typeof createServerClient>} Supabaseクライアントインスタンス
 */
export function createClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cookiesToSet.forEach(({ name, value, options }: any) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })
}
