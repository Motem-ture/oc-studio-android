'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Download, Settings, Trash2, X } from 'lucide-react'

import { useExportCenter } from '@/components/shared/export/ExportCenterHost'

import { ALBUM_ITEM, HOME_ITEM, NAV_GROUPS, toolIcon } from '@/lib/nav-sections'
import { mobileTargetFor } from '@/lib/mobile-nav-targets'
import { useI18n } from '@/lib/i18n'
import { GROUP_LABEL_KEYS, NAV_LABEL_KEYS } from '@/lib/i18n/messages'
import { categoryIconOf } from '@/lib/categories/icons'
import { categoryItemName } from '@/lib/categories/types'
import { useCategories } from '@/lib/categories/store'
import { isPluginEnabled, isSidebarTool, usePlugins } from '@/lib/plugins'
import { toolItem } from '@/lib/entry-kinds'
import { useSettings } from '@/lib/settings'
import { useNavigation } from './NavigationContext'
import { useMobileNavigation } from './MobileNavigationContext'
import { useSettingsTrigger } from './SettingsTriggerContext'
import { useTrashOverlay } from './TrashOverlayContext'

interface DrawerState {
  open: boolean
  setOpen: (value: boolean) => void
  toggle: () => void
}

const DrawerContext = createContext<DrawerState>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
})

export function useMobileDrawer(): DrawerState {
  return useContext(DrawerContext)
}

/** 桌面侧栏的条目 → 移动端分区。手机上的内容是按 `section` 路由的，两边必须对上。 */
// 对照表与桌面侧栏共用一份（`lib/mobile-nav-targets.ts`）

const DRAWER_WIDTH = 300
const EDGE_ZONE = 26
const OPEN_THRESHOLD = 56
const CLOSE_THRESHOLD = 56

function drawerWidth(): number {
  if (typeof window === 'undefined') return DRAWER_WIDTH
  return Math.min(Math.round(window.innerWidth * 0.84), DRAWER_WIDTH)
}

export function MobileDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false)

  const setOpen = useCallback((value: boolean) => setOpenState(value), [])
  const toggle = useCallback(() => setOpenState((prev) => !prev), [])

  // 原生壳的「覆盖 / 推移」与「抽屉是否打开」都记在 <html> 上：
  // 推移模式要移动 `[data-app-shell]`，那棵树不在本组件的子树里，只能靠属性 + CSS。
  const { settings } = useSettings()
  useEffect(() => {
    const root = document.documentElement
    root.dataset.drawerMode = settings.drawerMode
  }, [settings.drawerMode])

  useEffect(() => {
    document.documentElement.dataset.drawerOpen = open ? 'true' : 'false'
  }, [open])

  const value = useMemo<DrawerState>(() => ({ open, setOpen, toggle }), [open, setOpen, toggle])

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
}

export function MobileDrawer() {
  const { open, setOpen } = useMobileDrawer()
  const { activeItem, setActiveItem } = useNavigation()
  const { section, gallerySubTab, setSection, setGallerySubTab } = useMobileNavigation()
  const { openSettings } = useSettingsTrigger()
  const { openTrash } = useTrashOverlay()
  const openExportCenter = useExportCenter()
  const { settings } = useSettings()
  const { t } = useI18n()
  const { plugins } = usePlugins()
  const categories = useCategories()

  const [mounted, setMounted] = useState(false)
  const [edgeOffset, setEdgeOffset] = useState(0)
  const [panelOffset, setPanelOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(DRAWER_WIDTH)

  useEffect(() => setMounted(true), [])

  const pushMode = settings.drawerMode === 'push'
  // 覆盖模式：抽屉压住内容；推移模式：内容整体右移（由 globals.css 处理）
  useEffect(() => {
    const root = document.documentElement
    if (!pushMode) root.removeAttribute('data-drawer-push')
    else root.setAttribute('data-drawer-push', 'true')
  }, [pushMode])

  // 抽屉是窄屏（手机竖屏）的东西：转到横屏（≥768）时桌面侧栏接管，这里要收起来
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => {
      if (window.innerWidth >= 768 && open) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, setOpen])

  /** 左边缘往右滑 → 打开 */
  useEffect(() => {
    if (!mounted || open) return
    let start: { x: number; y: number } | null = null
    let horizontal = false
    const onDown = (e: PointerEvent) => {
      if (window.innerWidth >= 768) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (e.clientX > EDGE_ZONE) return
      start = { x: e.clientX, y: e.clientY }
      horizontal = false
      widthRef.current = drawerWidth()
    }
    const onMove = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (!horizontal) {
        if (Math.abs(dx) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          start = null
          return
        }
        horizontal = true
        setDragging(true)
      }
      if (dx > 0) setEdgeOffset(Math.min(dx, widthRef.current))
    }
    const finish = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      const shouldOpen = horizontal && dx > OPEN_THRESHOLD
      start = null
      horizontal = false
      setDragging(false)
      setEdgeOffset(0)
      if (shouldOpen) setOpen(true)
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', finish, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', finish, true)
    }
  }, [mounted, open, setOpen])

  /** 抽屉开着时：点内容区 / 在内容区往左滑 → 收回 */
  useEffect(() => {
    if (!open) return
    let start: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (target && panelRef.current?.contains(target)) return
      start = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const moved = Math.abs(dx) > 8 || Math.abs(dy) > 8
      start = null
      // 轻点：收起来（「点编辑页面缩回去」）；横滑到左边阈值也收起来
      if (!moved || (Math.abs(dx) > Math.abs(dy) && dx < -CLOSE_THRESHOLD)) setOpen(false)
    }
    const onCancel = () => {
      start = null
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onCancel, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onCancel, true)
    }
  }, [open, setOpen])

  /** 抽屉面板上往左拖 → 跟着手走，松手过阈值就关 */
  const onPanelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const startX = e.clientX
    const pointerId = e.pointerId
    widthRef.current = drawerWidth()
    let moved = false
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture?.(pointerId)
    } catch {
      // 合成事件 / 老内核没有活动指针：不影响下面的 window 监听
    }
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      setPanelOffset(Math.min(0, dx))
    }
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      setDragging(false)
      setPanelOffset(0)
      if (moved && dx < -CLOSE_THRESHOLD) setOpen(false)
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
  }

  const close = useCallback(() => setOpen(false), [setOpen])

  const navigateTo = useCallback(
    (label: string | null) => {
      if (label === null) {
        setActiveItem(null)
        setSection('home')
      } else {
        const target = mobileTargetFor(label)
        if (target) {
          setActiveItem(label === '主页' ? null : label)
          setSection(target.section)
          if (target.sub) setGallerySubTab(target.sub)
        } else {
          // 工具插件：移动端没有专属分区，借用 category 这个「跟随 activeItem」的壳
          setActiveItem(label)
          setSection('category')
        }
      }
      close()
    },
    [close, setActiveItem, setGallerySubTab, setSection],
  )

  const navigateCategory = useCallback(
    (categoryId: string) => {
      setActiveItem(categoryItemName(categoryId))
      setSection('category')
      close()
    },
    [close, setActiveItem, setSection],
  )

  const toolPlugins = plugins.filter(
    (plugin) => isSidebarTool(plugin) && isPluginEnabled(plugin),
  )

  const isActive = (label: string | null): boolean => {
    if (label === null || label === HOME_ITEM.label) return section === 'home'
    switch (label) {
      case '角色':
        return section === 'gallery' && gallerySubTab === 'characters'
      case '事件':
        return section === 'gallery' && gallerySubTab === 'events'
      case '国家':
        return section === 'gallery' && gallerySubTab === 'countries'
      case '世界观':
        return section === 'wiki'
      case '小说':
        return section === 'novel'
      case '表格':
        return section === 'tree'
      case '地图':
        return section === 'map'
      case '时间线':
        return section === 'timeline'
      case '关系图':
        return section === 'relations'
      case '相册':
        return section === 'album'
      default:
        return activeItem === label
    }
  }

  if (!mounted) return null

  const width = drawerWidth()
  const translate = open ? panelOffset : -width + edgeOffset
  const transition = dragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'

  const rowClass = (active: boolean) =>
    `flex h-10 w-full items-center gap-3 rounded-item px-4 text-left text-ui transition-colors ${
      active ? 'bg-[var(--oc-hover)] text-ink' : 'text-ink-muted hover:bg-[var(--oc-hover)] hover:text-ink'
    }`
  const groupLabel = 'px-4 pb-1 pt-4 text-micro tracking-[0.14em] text-ink-faint'

  return createPortal(
    <div
      className="fixed inset-0 z-[120] md:hidden"
      data-mobile-drawer
      style={{ pointerEvents: open || edgeOffset > 0 ? 'auto' : 'none' }}
      aria-hidden={!open}
    >
      {/* 覆盖模式：压一层遮罩；推移模式：不遮住内容，点空白即收起 */}
      <div
        className="absolute inset-0 bg-black/35"
        onClick={close}
        style={{
          opacity: open ? 1 : 0,
          background: pushMode ? 'transparent' : undefined,
          transition: dragging ? 'none' : 'opacity 220ms',
        }}
      />
      <div
        ref={panelRef}
        role="navigation"
        aria-label={t('mobile.drawerNav')}
        onPointerDown={onPanelPointerDown}
        style={{
          width,
          transform: `translate3d(${translate}px, 0, 0)`,
          transition,
        }}
        className="absolute inset-y-0 left-0 flex touch-pan-y flex-col border-r border-line bg-paper shadow-[0_0_40px_rgba(0,0,0,0.18)]"
      >
        <div
          className="flex items-center justify-between px-4 pb-2"
          style={{ paddingTop: 'calc(12px + var(--safe-top))' }}
        >
          <span className="font-serif text-lg font-bold text-ink">OC Studio</span>
          <button
            type="button"
            onClick={close}
            data-drawer-close
            aria-label={t('mobile.closeDrawer')}
            className="flex h-9 w-9 items-center justify-center rounded-item text-ink-muted transition-colors hover:bg-[var(--oc-hover)] hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto pb-2">
          <button type="button" onClick={() => navigateTo(null)} className={rowClass(isActive(HOME_ITEM.label))}>
            <HOME_ITEM.icon size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{t('nav.home')}</span>
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className={groupLabel}>{t(GROUP_LABEL_KEYS[group.label] ?? group.label)}</div>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateTo(item.label)}
                  className={rowClass(isActive(item.label))}
                >
                  <item.icon size={17} strokeWidth={2} className="shrink-0" />
                  <span className="truncate">{t(NAV_LABEL_KEYS[item.label] ?? item.label)}</span>
                </button>
              ))}
            </div>
          ))}

          {toolPlugins.length > 0 ? (
            <div>
              <div className={groupLabel}>{t('nav.tools')}</div>
              {toolPlugins.map((plugin) => {
                const Icon = toolIcon(plugin.id)
                const item = toolItem(plugin.id)
                return (
                  <button
                    key={plugin.id}
                    type="button"
                    onClick={() => navigateTo(item)}
                    className={rowClass(activeItem === item)}
                  >
                    <Icon size={17} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{plugin.name}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {categories.filter((category) => category.enabled).length > 0 ? (
            <div>
              <div className={groupLabel}>{t('nav.categories')}</div>
              {categories
                .filter((category) => category.enabled)
                .map((category) => {
                  const Icon = categoryIconOf(category.icon)
                  const active = section === 'category' && activeItem === categoryItemName(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigateCategory(category.id)}
                      className={rowClass(active)}
                    >
                      <Icon size={17} strokeWidth={2} className="shrink-0" />
                      <span className="truncate">{category.name}</span>
                    </button>
                  )
                })}
            </div>
          ) : null}
        </nav>

        <div
          className="flex flex-col border-t border-line py-2"
          style={{ paddingBottom: 'calc(8px + var(--safe-bottom))' }}
        >
          <button type="button" onClick={() => navigateTo(ALBUM_ITEM.label)} className={rowClass(isActive(ALBUM_ITEM.label))}>
            <ALBUM_ITEM.icon size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{t('nav.album')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              openExportCenter()
            }}
            className={rowClass(false)}
          >
            <Download size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{t('nav.exportCenter')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              openTrash()
            }}
            className={rowClass(false)}
          >
            <Trash2 size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{t('nav.trash')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              openSettings()
            }}
            className={rowClass(false)}
          >
            <Settings size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{t('nav.settings')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}