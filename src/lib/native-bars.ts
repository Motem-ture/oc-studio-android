/**
 * 原生系统栏桥（仅 Android 壳里有）。
 *
 * 壳在 `MainActivity` 里注入了 `window.OcNative`：
 * - `setHideStatusBar(hide)` 真正 hide / show 状态栏（沉浸式）
 * - `isStatusBarHidden()`   回读当前偏好
 * - `getSafeTopPx()`        顶部需要避让的高度（CSS px）：状态栏可见时是状态栏高度，
 *                           隐藏时是挖孔高度；藏起来后它通常是 0
 *
 * 浏览器 / Tauri 桌面端没有这个对象，所有函数都是安全的空操作。
 */

export interface OcNativeBridge {
  setHideStatusBar(hide: boolean): void
  isStatusBarHidden(): boolean
  getSafeTopPx(): number
  /** 深色主题传 true：系统栏图标用浅色，避免和透明栏后面的背景糊在一起 */
  setLightSystemBarIcons?(light: boolean): void
  /**
   * 用系统分享面板把 Cache 里的文件交给用户（Android 10+ 不允许直接写公共目录）。
   * `path` 可以是 `file://` URI，也可以是绝对路径。
   */
  shareFile?(path: string, title: string, mimeType: string): void
}

declare global {
  interface Window {
    OcNative?: OcNativeBridge
  }
}

export function getNativeUi(): OcNativeBridge | undefined {
  if (typeof window === 'undefined') return undefined
  const bridge = window.OcNative
  if (!bridge || typeof bridge.setHideStatusBar !== 'function') return undefined
  return bridge
}

export function isNativeUiAvailable(): boolean {
  return getNativeUi() !== undefined
}

/**
 * 把「隐藏状态栏」偏好交给原生，并同步一次顶部安全区。
 * 返回是否真的调到了原生（浏览器里恒为 false）。
 */
export function applyStatusBarPreference(hide: boolean): boolean {
  const bridge = getNativeUi()
  if (!bridge) return false
  try {
    bridge.setHideStatusBar(hide)
    // 原生收起 / 放下状态栏是异步的，等一帧再回读才不会拿到旧值
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => syncSafeTop())
    } else {
      setTimeout(syncSafeTop, 32)
    }
    return true
  } catch {
    return false
  }
}

/**
 * 把原生量到的顶部高度写进 `--safe-top`。
 *
 * 为什么必须覆盖：状态栏藏起来以后 WebView 的 `env(safe-area-inset-top)` 会变成 0，
 * 而 AppShell 里那段「安全区兜底」看到 0 会估算成 24px —— 顶部就凭空多出一条空白。
 * 行内自定义属性优先级高于样式表里的兜底规则，所以这里直接覆盖。
 * 拿不到原生值时什么都不做，交回给 env() / 估算。
 */
export function syncSafeTop(): void {
  const bridge = getNativeUi()
  if (!bridge || typeof document === 'undefined') return
  try {
    const px = bridge.getSafeTopPx()
    if (!Number.isFinite(px) || px < 0) return
    document.documentElement.style.setProperty('--safe-top', `${Math.round(px)}px`)
  } catch {
    // 读不到就保持 env() / 估算的结果
  }
}

/**
 * 告诉原生「现在是深色还是浅色」。
 *
 * 状态栏藏起来之后这条主要影响底部导航栏（三键 / 手势条）：导航栏是透明的，
 * 深色主题配深色图标等于看不见。系统默认的 `windowLightNavigationBar` 是写死的，
 * 主题切换必须运行时跟着改。
 */
export function syncSystemBarIconContrast(): void {
  const bridge = getNativeUi()
  if (!bridge?.setLightSystemBarIcons || typeof document === 'undefined') return
  try {
    const isDark = document.documentElement.classList.contains('dark')
    bridge.setLightSystemBarIcons(isDark)
  } catch {
    // 老壳没有这个方法，忽略
  }
}

/**
 * 原生分享：把已经写进 Cache 的文件交给系统分享面板。
 *
 * 返回 false 表示当前环境没有这个能力（浏览器 / 桌面 / 老壳），调用方要自己兜底。
 * 注意它**不等待用户选择**：面板弹出来就算成功。
 */
export function shareFileNatively(path: string, title: string, mimeType: string): boolean {
  const bridge = getNativeUi()
  if (!bridge?.shareFile) return false
  try {
    bridge.shareFile(path, title, mimeType)
    return true
  } catch {
    return false
  }
}
