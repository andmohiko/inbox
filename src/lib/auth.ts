/**
 * 認証関連のユーティリティ関数
 *
 * 概要:
 * - サーバーサイドでの認証状態確認
 * - ユーザー情報の取得
 *
 * 主な仕様:
 * - サーバーコンポーネントやServer Actionsで使用
 * - Supabaseのセッションからユーザー情報を取得
 *
 * 制限事項:
 * - サーバー環境でのみ使用可能
 */

import { createClient } from './supabase/server'

/**
 * 現在のユーザー情報を取得
 *
 * @returns {Promise<{ id: string; email: string; name?: string } | null>} ユーザー情報、未認証の場合はnull
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('ユーザー取得エラー:', {
      functionName: 'getCurrentUser',
      errorMessage: error.message,
      errorCode: error.status,
    })
    return null
  }

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    name:
      user.user_metadata?.full_name || user.user_metadata?.name || undefined,
  }
}

/**
 * 認証状態を確認
 *
 * @returns {Promise<boolean>} 認証済みの場合はtrue、未認証の場合はfalse
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return user !== null
}
