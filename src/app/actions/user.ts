/**
 * ユーザー関連のServer Actions
 *
 * 概要:
 * - ユーザー情報の作成・取得処理
 * - Prismaを使用してデータベースにアクセス
 *
 * 主な仕様:
 * - Server Actionsとして実装
 * - Supabaseの認証ユーザーIDをPrismaのUser IDとして使用
 *
 * 制限事項:
 * - サーバー環境でのみ実行可能
 */

'use server'

import { prisma } from '@/lib/prisma'

/**
 * ユーザー情報の型定義
 */
export interface UserData {
  /**
   * Supabaseの認証ユーザーID
   */
  id: string
  /**
   * メールアドレス
   */
  email: string
  /**
   * ユーザー名（任意）
   */
  name?: string
}

/**
 * ユーザーを作成または更新
 * 既に存在する場合は更新、存在しない場合は作成
 *
 * @param {UserData} userData - ユーザー情報
 * @returns {Promise<{ id: string; email: string; name: string | null }>} 作成または更新されたユーザー情報
 */
export async function upsertUser(userData: UserData) {
  try {
    const user = await prisma.user.upsert({
      where: {
        id: userData.id,
      },
      update: {
        email: userData.email,
        name: userData.name || null,
      },
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name || null,
      },
    })

    return user
  } catch (error) {
    console.error('ユーザー作成/更新エラー:', {
      functionName: 'upsertUser',
      userId: userData.id,
      email: userData.email,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(
      `ユーザーの作成/更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * ユーザーIDでユーザー情報を取得
 *
 * @param {string} userId - ユーザーID
 * @returns {Promise<{ id: string; email: string; name: string | null } | null>} ユーザー情報、存在しない場合はnull
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    return user
  } catch (error) {
    console.error('ユーザー取得エラー:', {
      functionName: 'getUserById',
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
