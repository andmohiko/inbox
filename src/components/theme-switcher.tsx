/**
 * @file テーマスイッチャーコンポーネント
 * @description ダークモードとライトモードの表示と切り替えを行うコンポーネント
 */

'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from './ui/button'

export function ThemeSwitcher() {
  // 初期値を関数形式で設定し、クライアントサイドでのみDOMをチェック
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  const toggleTheme = () => {
    const willBeDarkMode = !isDarkMode
    setIsDarkMode(willBeDarkMode)
    if (willBeDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
