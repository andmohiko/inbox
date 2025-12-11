/**
 * ホームページ
 *
 * 概要:
 * - アプリケーションのトップページ
 * - Dashboardコンポーネントを表示
 *
 * 主な仕様:
 * - Server Componentとして実装
 * - 認証チェックはDashboardコンポーネント内で実施
 *
 * 制限事項:
 * - 認証済みユーザーのみアクセス可能
 */

import { Dashboard } from './components/dashboard'

/**
 * ホームページコンポーネント
 */
export default function Home() {
  return <Dashboard />
}
