'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Palette, Waypoints } from 'lucide-react'
import { useSettings } from '@/lib/settings'
import { readBlurPreference, writeBlurPreference } from '@/lib/blur-preference'
import { isTauri as isTauriEnv } from '@/lib/env'
import { SettingsEntryRow } from '../EntryRow'
import { SettingsSubPage } from '../SubPage'
import { ThemePanel } from '../ThemePanel'
import { RelationsPanel } from '../RelationsPanel'
import { ThemeRadio, LayoutRadio, DrawerModeRadio, SWITCH_CLASSES, SWITCH_DOT } from '../controls'
import { isNativeUiAvailable } from '@/lib/native-bars'
import { useI18n } from '@/lib/i18n'
import { LOCALES } from '@/lib/i18n/messages'
import {
  SETTINGS_FIELD,
  SETTINGS_FIELD_GROUP_FIRST,
  SETTINGS_GROUP,
  SETTINGS_HINT,
  SETTINGS_LABEL,
  SETTINGS_TOGGLE_ROW,
} from '@/lib/ui-tokens'

/** 「个性化」的二级页：外观（纸色 / 背景 / 封面卡）与关系图操作 */
type Panel = 'root' | 'theme' | 'relations'

export function GeneralTab() {
  const { settings, updateSetting } = useSettings()
  const { t, locale, setLocale } = useI18n()
  
  const [panel, setPanel] = useState<Panel>('root')
  // 默认开：支持的系统一装上就有毛玻璃（见 lib/blur-preference.ts）
  const [blurEnabled, setBlurEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return readBlurPreference()
  })
  const [blurSupported, setBlurSupported] = useState(false)
  // 原生系统栏桥只有 Android 壳里有；水合后再判断，避免服务端 / 客户端首帧不一致
  const [nativeUi, setNativeUi] = useState(false)
  useEffect(() => setNativeUi(isNativeUiAvailable()), [])

  const isTauri = isTauriEnv()

  const toggleDisabled = !isTauri || !blurSupported

  useEffect(() => {
    if (!isTauri) return
    try {
      // 只探测能力。别再用 init_blur(false) 当探针 —— 那会真的把当前的 Mica 关掉。
      invoke<boolean>('blur_supported').then((supported) => {
        if (supported === true) setBlurSupported(true)
      }).catch(() => {})
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlurToggle = () => {
    if (toggleDisabled || settings.backgroundImage !== '') return
    const next = !blurEnabled
    setBlurEnabled(next)
    writeBlurPreference(next)
    try {
      invoke<boolean>("update_blur_effect", {
        enabled: next,
        isDark: document.documentElement.classList.contains("dark"),
      }).then((applied) => {
        document.documentElement.classList.toggle("tauri-mica", applied)
      }).catch(() => {})
    } catch {}
  }

  /** 开关行：标签靠左、开关靠右（单行控件，用 `SETTINGS_TOGGLE_ROW`） */
  const switchRow = (label: React.ReactNode, checked: boolean, disabled: boolean, onToggle: () => void, extra?: React.ReactNode) => (
    <div className={SETTINGS_TOGGLE_ROW}>
      <span className={SETTINGS_LABEL}>{label}</span>
      <div className="flex flex-col items-end gap-1">
        <button
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={`${SWITCH_CLASSES.base} ${checked ? SWITCH_CLASSES.on : SWITCH_CLASSES.off} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className={`${SWITCH_DOT} ${checked ? "translate-x-[18px] bg-paper" : "translate-x-[2px]"}`} />
        </button>
        {extra}
      </div>
    </div>
  )

  if (panel === 'theme') {
    return (
      <SettingsSubPage title="主题" onBack={() => setPanel('root')}>
        <ThemePanel />
      </SettingsSubPage>
    )
  }

  if (panel === 'relations') {
    return (
      <SettingsSubPage title="关系图操作" onBack={() => setPanel('root')}>
        <RelationsPanel />
      </SettingsSubPage>
    )
  }

  return (
    <div className="flex flex-col">
      {/* 先给最常改的两个单选组（显示模式 / 编辑界面），二级页入口排在它们后面 */}
      <div className={SETTINGS_FIELD_GROUP_FIRST}>
        <div className={SETTINGS_FIELD}>
          <span className={SETTINGS_LABEL}>{t('settings.theme')}</span>
          <ThemeRadio
            value={settings.theme}
            onChange={(v) => updateSetting("theme", v as "light" | "dark" | "auto")}
          />
        </div>
        <div className={SETTINGS_FIELD}>
          <span className={SETTINGS_LABEL}>{t('settings.editorLayout')}</span>
          <LayoutRadio
            value={settings.editorLayout}
            onChange={(v) => updateSetting("editorLayout", v)}
          />
        </div>
        <div className={SETTINGS_FIELD}>
          <span className={SETTINGS_LABEL}>{t('settings.language')}</span>
          <div className="flex flex-wrap gap-x-8 gap-y-1.5">
            {LOCALES.map((item) => {
              const selected = locale === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocale(item.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 text-ui leading-none transition-colors ${
                    selected ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-line-hover' : 'border-line'
                    }`}
                    aria-hidden
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" /> : null}
                  </span>
                  {item.nativeLabel}
                </button>
              )
            })}
          </div>
          <span className={SETTINGS_HINT}>{t('settings.language.hint')}</span>
        </div>
        <div className={SETTINGS_FIELD}>
          <span className={SETTINGS_LABEL}>{t('settings.drawerMode')}</span>
          <DrawerModeRadio
            value={settings.drawerMode}
            onChange={(v) => updateSetting("drawerMode", v)}
          />
          <span className={SETTINGS_HINT}>{t('settings.drawerMode.hint')}</span>
        </div>
      </div>

      <div className={SETTINGS_GROUP}>
        <div className="flex flex-col">
          <SettingsEntryRow icon={Palette} label={t('settings.themePreset')} onClick={() => setPanel('theme')} />
          <SettingsEntryRow icon={Waypoints} label={t('settings.relations')} onClick={() => setPanel('relations')} />
        </div>
      </div>

      <div className={SETTINGS_GROUP}>
        {switchRow(
          t('settings.hideStatusBar'),
          nativeUi ? settings.hideStatusBar : false,
          !nativeUi,
          () => updateSetting("hideStatusBar", !settings.hideStatusBar),
          <span className={SETTINGS_HINT}>
            {nativeUi ? t('settings.hideStatusBar.hint') : t('settings.hideStatusBar.mobileOnly')}
          </span>,
        )}
        {switchRow(
          t('settings.windowBlur'),
          // 能力未知 / 不支持时显示为关，别让一个点不动的开关亮着
          blurSupported && blurEnabled,
          toggleDisabled || settings.backgroundImage !== "",
          handleBlurToggle,
          settings.backgroundImage !== "" ? <span className={SETTINGS_HINT}>与背景图互斥</span> : null,
        )}
        {switchRow(
          t('settings.autoStart'),
          // 没实现就别给一个能拨的开关：拨亮了、重启却没反应，比没有这个开关更糟
          false,
          true,
          () => {},
          <span className={SETTINGS_HINT}>{t('settings.wip')}</span>,
        )}
      </div>
    </div>
  )
}
