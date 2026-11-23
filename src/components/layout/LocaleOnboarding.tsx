'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { LOCALES, type Locale } from '@/lib/i18n/messages'

/**
 * 首次安装的语言选择。
 *
 * 触发条件只有一个：`localStorage` 里**没有**语言记录（`chosen === false`）。
 * 不用「设置项等于默认值」来判断 —— 用户主动选中文和从没选过长得一样。
 *
 * 选完立即落盘并关闭；之后可以在「设置 › 个性化 › 语言」里改。
 */
export function LocaleOnboarding() {
  const { chosen, locale, setLocale, t } = useI18n()
  const [selected, setSelected] = useState<Locale>(locale)

  // 语言在 useEffect 里才从存储读出来，跟上它
  useEffect(() => {
    setSelected(locale)
  }, [locale])

  if (chosen) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-paper px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locale-onboarding-title"
    >
      <div className="w-full max-w-[420px]">
        <div className="text-micro tracking-[0.18em] text-ink-faint">OC STUDIO</div>
        <h1 id="locale-onboarding-title" className="mt-3 font-serif text-[28px] font-bold leading-tight text-ink">
          {t('onboarding.title')}
        </h1>
        <p className="mt-1 font-serif text-[15px] text-ink-muted">{t('onboarding.subtitle')}</p>

        <div className="mt-7 flex flex-col gap-2">
          {LOCALES.map((item) => {
            const active = selected === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                onDoubleClick={() => setLocale(item.id)}
                aria-pressed={active}
                className={`flex items-center justify-between rounded-panel border px-4 py-3 text-left transition-colors ${
                  active ? 'border-line-hover bg-[var(--oc-hover)]' : 'border-line hover:bg-[var(--oc-hover)]'
                }`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-serif text-[17px] leading-tight text-ink">{item.nativeLabel}</span>
                  <span className="mt-0.5 text-micro text-ink-faint">{item.hint[locale]}</span>
                </span>
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                    active ? 'border-line-hover' : 'border-line'
                  }`}
                  aria-hidden
                >
                  {active ? <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" /> : null}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-micro leading-relaxed text-ink-faint">{t('onboarding.desc')}</p>

        <button
          type="button"
          onClick={() => setLocale(selected)}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-control border border-ink bg-ink text-[15px] text-paper transition-opacity hover:opacity-90"
        >
          <Check size={16} strokeWidth={2} />
          {t('onboarding.continue')}
        </button>
      </div>
    </div>
  )
}