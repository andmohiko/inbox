/**
 * Supabaseクライアント（ブラウザ用）
 *
 * 概要:
 * - ブラウザ環境で使用するSupabaseクライアント
 * - クライアントコンポーネントでの認証処理に使用
 *
 * 主な仕様:
 * - createBrowserClientを使用してクライアントインスタンスを作成
 * - 環境変数からSupabaseのURLとAnon Keyを取得
 *
 * 制限事項:
 * - ブラウザ環境でのみ使用可能
 * - 環境変数が設定されていない場合はエラーをスロー
 */

import { createBrowserClient } from '@supabase/ssr'

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
 * ブラウザ用Supabaseクライアント
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
