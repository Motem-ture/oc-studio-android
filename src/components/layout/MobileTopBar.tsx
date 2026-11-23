'use client'

import { useState } from 'react'
import { Menu, Search, PanelLeft } from 'lucide-react'
import { MobileSearchOverlay } from './MobileSearchOverlay'
import { useMobileNavigation, type GallerySubTab } from './MobileNavigationContext'
import { useMobilePageHeader } from './MobilePageHeaderContext'
import { useMobileDrawer } from './MobileDrawer'
import { useI18n } from '@/lib/i18n'

/** 分区 → 文案 key（值是 key，不是文案：语言切换即时生效） */
const SECTION_TITLES: Record<string, string> = {
  wiki: 'tabs.wiki',
  timeline: 'tabs.timeline',
  relations: 'tabs.relations',
  album: 'tabs.album',
  home: 'nav.home',
  novel: 'nav.novel',
  map: 'nav.map',
  tree: 'nav.table',
  category: 'nav.categories',
}

const GALLERY_TITLES: Record<GallerySubTab, string> = {
  characters: 'nav.characters',
  events: 'nav.events',
  countries: 'nav.countries',
}

/**
 * 手机顶栏。
 *
 * 以前这里是一整排「角色 / 事件 / 国家」大字页签 + 更多 / 搜索 / 回收站 / 设置四个图标，
 * 横着占满一行，缩进又比内容多一截 —— 现在这些入口都收进左侧抽屉（`MobileDrawer`），
 * 顶栏只留：菜单键、当前版面标题、搜索。高度仍是 60px：各版面的 `max-md:pt-[…]`
 * 都是按这个数留白的，改高度会牵动一整片版面。
 */
export function MobileTopBar() {
  const { section, gallerySubTab } = useMobileNavigation()
  const { title: pageTitle } = useMobilePageHeader()
  const { t } = useI18n()
  const { toggle: toggleDrawer } = useMobileDrawer()
  const [searchOpen, setSearchOpen] = useState(false)

  const needsMenu = section === 'wiki' || section === 'album'
  const displayTitle =
    pageTitle ??
    t(section === 'gallery' ? GALLERY_TITLES[gallerySubTab] : (SECTION_TITLES[section] ?? 'app.name'))

  return (
    <div
      data-mobile-topbar
      className="md:hidden fixed top-0 left-0 right-0 z-20 flex h-[calc(60px+var(--safe-top))] items-center justify-between gap-2 border-b border-line bg-paper/85 px-2 pt-[var(--safe-top)] backdrop-blur-lg"
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={toggleDrawer}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-muted transition-colors hover:text-ink active:bg-[var(--oc-hover)]"
          aria-label={t('mobile.openDrawer')}
        >
          <Menu size={21} strokeWidth={2} />
        </button>
        {needsMenu ? (
          <button
            type="button"
            onClick={() => {
              if (section === 'wiki') window.dispatchEvent(new Event('worldToggle'))
              else if (section === 'album') window.dispatchEvent(new Event('albumToggle'))
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-muted transition-colors hover:text-ink active:bg-[var(--oc-hover)]"
            aria-label={t('mobile.directory')}
          >
            <PanelLeft size={19} strokeWidth={2} />
          </button>
        ) : null}
        <span className="truncate pl-1 font-serif text-lg font-bold text-ink">{displayTitle}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-10 w-10 items-center justify-center text-ink-muted transition-colors hover:text-ink active:bg-[var(--oc-hover)]"
          aria-label={t('mobile.search')}
        >
          <Search size={20} strokeWidth={2} />
        </button>
      </div>

      <MobileSearchOverlay key={searchOpen ? 'open' : 'closed'} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}