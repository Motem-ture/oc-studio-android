'use client'

/**
 * 极小的 i18n 运行时：一个 Provider + `t()`，不引第三方库。
 *
 * - 语言存在 `localStorage`（独立于设置对象：**「没存过」= 首次安装**，
 *   这是首启语言选择弹窗的判断依据，塞进 settings 的默认值里就分不出来了）。
 * - `t(key)` 查不到时先回落到中文，再回落到 key 本身 —— 新文案只写中文也能跑。
 * - 文案变更即时生效：Provider 换 value 会让所有 `useI18n()` 重渲染。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  DEFAULT_LOCALE,
  LOCALES,
  MESSAGES,
  guessLocale,
  normalizeLocale,
  type Locale,
} from './messages'

const STORAGE_KEY = 'oc-studio-locale'

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return normalizeLocale(raw)
  } catch {
    return null
  }
}

interface I18nValue {
  locale: Locale
  /** 用户是否已经选过语言（false = 首次安装，需要弹选择框） */
  chosen: boolean
  setLocale: (next: Locale) => void
  /** 取文案；支持 `{name}` 占位符插值 */
  t: (key: string, vars?: Record<string, string | number>) => string
  /** 语言自身的名字（如「简体中文」「English」），永远不翻译 */
  localeName: (id: Locale) => string
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  chosen: true,
  setLocale: () => {},
  t: (key) => MESSAGES[DEFAULT_LOCALE][key] ?? key,
  localeName: (id) => LOCALES.find((item) => item.id === id)?.nativeLabel ?? id,
})

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // 服务端渲染时用默认语言；客户端首帧之后再切到真实语言，避免水合不一致
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [chosen, setChosen] = useState(true)

  useEffect(() => {
    const stored = readStoredLocale()
    if (stored === null) {
      // 首次安装：不立刻落盘，等用户在弹窗里选了再写
      setLocaleState(guessLocale())
      setChosen(false)
      return
    }
    setLocaleState(stored)
    setChosen(true)
  }, [])

  // <html lang> 跟着语言走：影响字体回退（中文字形）与读屏语言
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN'
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    const normalized = normalizeLocale(next)
    setLocaleState(normalized)
    setChosen(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized)
    } catch {
      // 存不进去也不影响本次会话
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const table = MESSAGES[locale]
      let text = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [locale],
  )

  const localeName = useCallback(
    (id: Locale) => LOCALES.find((item) => item.id === id)?.nativeLabel ?? id,
    [],
  )

  const value = useMemo<I18nValue>(
    () => ({ locale, chosen, setLocale, t, localeName }),
    [locale, chosen, setLocale, t, localeName],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}