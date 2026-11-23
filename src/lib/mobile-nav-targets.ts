/**
 * 桌面侧栏条目 → 移动端分区的对照表。
 *
 * 手机上的内容是按 `MobileSection` 路由的（`use-entity-workspace` 里那段三元），
 * 而桌面侧栏只会改 `activeItem`。两边不对上时，横屏（宽度 ≥768，桌面外壳出现）
 * 点左栏就会「看着高亮了却什么都不换」。侧栏与手机抽屉都从这里取。
 */
import type { GallerySubTab, MobileSection } from '@/components/layout/MobileNavigationContext'

export interface MobileNavTarget {
  section: MobileSection
  sub?: GallerySubTab
}

export const MOBILE_NAV_TARGETS: Record<string, MobileNavTarget> = {
  主页: { section: 'home' },
  角色: { section: 'gallery', sub: 'characters' },
  事件: { section: 'gallery', sub: 'events' },
  国家: { section: 'gallery', sub: 'countries' },
  世界观: { section: 'wiki' },
  小说: { section: 'novel' },
  表格: { section: 'tree' },
  地图: { section: 'map' },
  时间线: { section: 'timeline' },
  关系图: { section: 'relations' },
  相册: { section: 'album' },
}

export function mobileTargetFor(label: string | null): MobileNavTarget | null {
  if (label === null) return { section: 'home' }
  return MOBILE_NAV_TARGETS[label] ?? null
}