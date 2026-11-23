'use client'

import { BookOpen, Globe, Clock, GitBranch, Images } from 'lucide-react'
import { useNavigation } from './NavigationContext'
import { useMobileNavigation, type MobileSection } from './MobileNavigationContext'
import { useI18n } from '@/lib/i18n'

const tabs: { section: MobileSection; key: string; icon: typeof BookOpen }[] = [
  { section: 'gallery', key: 'tabs.gallery', icon: BookOpen },
  { section: 'wiki', key: 'tabs.wiki', icon: Globe },
  { section: 'timeline', key: 'tabs.timeline', icon: Clock },
  { section: 'relations', key: 'tabs.relations', icon: GitBranch },
  { section: 'album', key: 'tabs.album', icon: Images },
]

export function MobileTabBar() {
  const { section, setSection } = useMobileNavigation()
  const { setActiveItem } = useNavigation()
  const { t } = useI18n()

  return (
    <nav data-mobile-tabbar className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-[calc(60px+var(--safe-bottom))] border-t border-line bg-paper/85 pb-[var(--safe-bottom)] backdrop-blur-lg">
      <div className="flex h-full items-center">
        {tabs.map((tab) => {
          const isActive = section === tab.section
          return (
            <button
              key={tab.section}
              onClick={() => {
                (document.activeElement as HTMLElement | null)?.blur()
                setActiveItem(null)
                setSection(tab.section)
              }}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-none py-2 transition-colors hover:bg-[var(--oc-hover)]"
            >
              <tab.icon
                size={20}
                strokeWidth={2}
                className={isActive ? 'text-ink' : 'text-ink-faint'}
              />
              <span
                className={`text-[10px] leading-none ${
                  isActive ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {t(tab.key)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
