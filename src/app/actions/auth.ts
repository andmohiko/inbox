/**
 * 認証関連のServer Actions
 *
 * 概要:
 * - ログアウト処理
 * - クライアントコンポーネントから呼び出し可能な認証操作
 *
 * 主な仕様:
 * - Server Actionsとして実装
 * - Supabaseのセッションをクリア
 *
 * 制限事項:
 * - サーバー環境でのみ実行可能
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * ログアウト処理
 * セッションをクリアし、ログインページにリダイレクト
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('ログアウトエラー:', {
      functionName: 'signOut',
      errorMessage: error.message,
      errorCode: error.status,
    })
    throw new Error(`ログアウトに失敗しました: ${error.message}`)
  }

  redirect('/login')
}
