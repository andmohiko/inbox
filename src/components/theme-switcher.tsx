/**
 * @file テーマスイッチャーコンポーネント
 * @description ダークモードとライトモードの表示と切り替えを行うコンポーネント
 */

'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from './ui/button'

/**
 * localStorageに保存するテーマ設定のキー名
 */
const THEME_STORAGE_KEY = 'theme-preference'

/**
 * テーマを適用する
 * @param {boolean} isDarkMode - ダークモードかどうか
 */
const applyTheme = (isDarkMode: boolean): void => {
  if (isDarkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * localStorageからテーマ設定を読み込む
 * @returns {boolean | null} 保存されているテーマ設定（存在しない場合はnull）
 */
const loadThemeFromStorage = (): boolean | null => {
  if (typeof window === 'undefined') {
    return null
  }
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark') {
    return true
  }
  if (savedTheme === 'light') {
    return false
  }
  return null
}

/**
 * localStorageにテーマ設定を保存する
 * @param {boolean} isDarkMode - ダークモードかどうか
 */
const saveThemeToStorage = (isDarkMode: boolean): void => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light')
}

export function ThemeSwitcher() {
  // 初期値を関数形式で設定し、クライアントサイドでのみDOMをチェック
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      // まずlocalStorageから読み込む
      const savedTheme = loadThemeFromStorage()
      if (savedTheme !== null) {
        return savedTheme
      }
      // localStorageに保存されていない場合は、システムの設定を確認
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
      return prefersDark
    }
    return false
  })

  // コンポーネントマウント時にテーマをDOMに適用
  useEffect(() => {
    // useStateの初期化で既に状態は設定されているので、DOMに適用するだけ
    // 初回マウント時のみ実行
    applyTheme(isDarkMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * テーマを切り替える
   */
  const toggleTheme = (): void => {
    const willBeDarkMode = !isDarkMode
    setIsDarkMode(willBeDarkMode)
    applyTheme(willBeDarkMode)
    saveThemeToStorage(willBeDarkMode)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label={
        isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'
      }
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
