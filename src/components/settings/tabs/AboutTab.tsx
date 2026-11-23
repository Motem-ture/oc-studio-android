'use client'

import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { APP_VERSION } from '@/lib/version'
import { openExternal } from '@/lib/open-external'
import { runUpdateCheck } from '@/lib/update-check-ui'
import { ICON_BTN, SETTINGS_ACTION_BTN } from '@/lib/ui-tokens'
import { CREDIT_GROUPS, type CreditItem } from '../credits'
import { SettingsEntryRow } from '../EntryRow'
import { PrivacyPanel } from './PrivacyPanel'
import { useI18n } from '@/lib/i18n'

const REPO_URL = 'https://github.com/Pokanshuu/OC-Studio'

function CreditRow({ item }: { item: CreditItem }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
      <button
        type="button"
        onClick={() => void openExternal(item.url)}
        className="group flex min-w-0 items-baseline gap-2 text-left"
        title={item.url}
      >
        <span className="shrink-0 text-ui text-ink underline-offset-2 group-hover:underline">{item.name}</span>
        {item.note ? <span className="truncate text-micro text-ink-faint">{item.note}</span> : null}
      </button>
      <span className="shrink-0 text-micro text-ink-faint">{item.license}</span>
    </div>
  )
}

export function AboutTab() {
  const { t } = useI18n()
  /** 二级界面：隐私声明 / 开源许可（长内容不铺在一级页面上） */
  const [panel, setPanel] = useState<'root' | 'privacy' | 'credits'>('root')
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  if (panel === 'privacy') {
    return <PrivacyPanel onBack={() => setPanel('root')} />
  }

  if (panel === 'credits') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel('root')}
            aria-label="返回"
            className={ICON_BTN}
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
          <span className="text-body leading-5 text-ink">{t('about.credits')}</span>
        </div>

        {CREDIT_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-1 text-micro tracking-[0.08em] text-ink-faint">{group.title}</h3>
            {group.items.map((item) => (
              <CreditRow key={item.name} item={item} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-body leading-5 text-ink">{t('about.version')}</span>
        <span className="font-mono text-body leading-5 text-ink-muted">v{APP_VERSION}</span>
      </div>

      <button
        type="button"
        disabled={checkingUpdate}
        onClick={() => {
          if (checkingUpdate) return
          setCheckingUpdate(true)
          void runUpdateCheck().finally(() => setCheckingUpdate(false))
        }}
        className={SETTINGS_ACTION_BTN}
      >
        {checkingUpdate ? t('about.checking') : t('about.checkUpdate')}
      </button>

      <button
        type="button"
        onClick={() => void openExternal(REPO_URL)}
        className={SETTINGS_ACTION_BTN}
      >
        <ExternalLink size={13} strokeWidth={2} />
        {t('about.repo')}
      </button>

      {/* 二级界面入口：行高与分隔线复用设置里的一级入口行 */}
      <div className="border-t border-line pt-2">
        <SettingsEntryRow label={t('about.privacy')} onClick={() => setPanel('privacy')} />
        <SettingsEntryRow label={t('about.credits')} onClick={() => setPanel('credits')} />
      </div>

      {/* 手机端移植说明：放在「开源许可」下面，一眼能看到 */}
      <div className="rounded-panel border border-line-soft bg-paper-alt/60 px-3 py-2.5">
        <p className="text-micro leading-5 text-ink-muted">{t('about.portNote')}</p>
        <p className="mt-1 text-micro leading-5 text-ink-faint">{t('about.portNoteSub')}</p>
        <p className="mt-2 border-t border-line-soft pt-2 text-micro leading-5 text-ink-muted">
          {t('about.noMaintenance')}
        </p>
        <p className="mt-1 text-micro leading-5 text-ink-faint">{t('about.noMaintenanceSub')}</p>
      </div>
    </div>
  )
}
