/**
 * 界面文案字典。
 *
 * 约定：
 * - key 用点分命名空间（`nav.*` / `settings.*` / `common.*`），值只放**界面**文案；
 *   用户内容（角色名、笔记正文）不进这里。
 * - `zh-CN` 是源语言，`en-US` 缺词条时回落到它 —— 新加文案只写中文也能跑。
 * - 板块名（角色 / 世界观 …）同时是导航的 `activeItem` 键，**不能翻译 key 本身**，
 *   所以 `nav.*` 只用于显示，跳转仍用中文字面量（见 NAV 常量）。
 */

export type Locale = 'zh-CN' | 'en-US'

export interface LocaleOption {
  id: Locale
  /** 语言自身的名字，永远用该语言书写（不跟随界面语言变） */
  nativeLabel: string
  /** 给当前界面语言看的说明 */
  hint: Record<Locale, string>
}

export const LOCALES: LocaleOption[] = [
  { id: 'zh-CN', nativeLabel: '简体中文', hint: { 'zh-CN': '界面使用简体中文', 'en-US': 'Simplified Chinese' } },
  { id: 'en-US', nativeLabel: 'English', hint: { 'zh-CN': '界面使用英文', 'en-US': 'Use English for the interface' } },
]

export const DEFAULT_LOCALE: Locale = 'zh-CN'

export function normalizeLocale(raw: unknown): Locale {
  return raw === 'en-US' ? 'en-US' : 'zh-CN'
}

/** 首次启动时的猜测：系统语言是中文就用中文，否则英文 */
export function guessLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const lang = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
  return lang.startsWith('zh') ? 'zh-CN' : 'en-US'
}

type Dict = Record<string, string>

const zh: Dict = {
  'app.name': 'OC Studio',

  'nav.home': '主页',
  'nav.group.gallery': '图鉴',
  'nav.group.create': '创作',
  'nav.group.views': '视图',
  'nav.characters': '角色',
  'nav.events': '事件',
  'nav.countries': '国家',
  'nav.world': '世界观',
  'nav.novel': '小说',
  'nav.table': '表格',
  'nav.map': '地图',
  'nav.timeline': '时间线',
  'nav.relations': '关系图',
  'nav.tools': '工具',
  'nav.categories': '自定义分类',
  'nav.newCategory': '新建分类',
  'nav.album': '相册',
  'nav.exportCenter': '导出中心',
  'nav.trash': '回收站',
  'nav.settings': '设置',

  'mobile.openDrawer': '打开侧栏',
  'mobile.closeDrawer': '关闭侧栏',
  'mobile.search': '搜索',
  'mobile.directory': '目录',
  'mobile.drawerNav': '侧栏导航',
  'tabs.gallery': '图鉴',
  'tabs.wiki': '世界观',
  'tabs.timeline': '时间线',
  'tabs.relations': '关系图',
  'tabs.album': '相册',

  'settings.title': '设置',
  'settings.tab.world': '世界',
  'settings.tab.general': '个性化',
  'settings.tab.plugins': '插件',
  'settings.tab.data': '数据',
  'settings.tab.about': '关于',
  'settings.close': '关闭',
  'settings.theme': '显示模式',
  'settings.themePreset': '主题',
  'settings.relations': '关系图操作',
  'settings.theme.light': '白天模式',
  'settings.theme.dark': '夜间模式',
  'settings.theme.auto': '跟随系统',
  'settings.editorLayout': '编辑界面',
  'settings.drawerMode': '手机侧栏呼出',
  'settings.drawerMode.overlay': '覆盖',
  'settings.drawerMode.push': '推移',
  'settings.drawerMode.hint': '覆盖：侧栏压在内容上；推移：内容随侧栏一起右移',
  'settings.hideStatusBar': '隐藏状态栏',
  'settings.hideStatusBar.hint': '沉浸式，下滑可临时唤出',
  'settings.hideStatusBar.mobileOnly': '仅手机端生效',
  'settings.windowBlur': '窗口模糊',
  'settings.autoStart': '开机自启动',
  'settings.wip': '开发中',
  'settings.language': '语言 / Language',
  'settings.language.hint': '切换后界面文案立即生效',

  'about.version': '版本',
  'about.checkUpdate': '检查更新',
  'about.checking': '正在检查…',
  'about.repo': '访问 GitHub 项目',
  'about.privacy': '隐私声明',
  'about.credits': '开源许可',
  'about.portNote':
    '本应用为 OC Studio 手机端移植版，完全免费，无任何收费项目，也不用于任何商业用途。',
  'about.portNoteSub': '原项目由 Pokanshuu 开源（MIT），此处仅为适配 Android 的重新打包。',
  'about.noMaintenance':
    '此项目仅作移植参考，将不会继续更新；需要改动请自行 fork 后维护。',
  'about.noMaintenanceSub':
    '上游 OC Studio 仍在更新，功能与修复请以上游为准。',

  'onboarding.title': '选择界面语言',
  'onboarding.subtitle': 'Choose your language',
  'onboarding.desc': '只会影响界面文字，你的内容不会被改动。之后可以在「设置 › 个性化」里随时切换。',
  'onboarding.continue': '继续',


  // 设置里的选项卡（RadioGrid 统一翻译，见 components/settings/controls.tsx）
  'option.light': '白天模式',
  'option.dark': '夜间模式',
  'option.auto': '跟随系统',
  'option.multi': '多栏',
  'option.full': '全屏',
  'option.autoLayout': '自动',
  'option.overlay': '覆盖',
  'option.push': '推移',
  'option.leftPan': '左键平移',
  'option.rightPan': '右键平移',
  'option.orthogonal': '正交',
  'option.curve': '曲线',
  'option.color': '彩色',
  'option.mono': '黑白',

  'common.close': '关闭',
  'common.back': '返回',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.confirm': '确定',
  'common.search': '搜索',
  'common.new': '新建',
  'common.delete': '删除',
  'common.loading': '加载中…',
}

const en: Dict = {
  'app.name': 'OC Studio',

  'nav.home': 'Home',
  'nav.group.gallery': 'Codex',
  'nav.group.create': 'Create',
  'nav.group.views': 'Views',
  'nav.characters': 'Characters',
  'nav.events': 'Events',
  'nav.countries': 'Nations',
  'nav.world': 'World',
  'nav.novel': 'Novel',
  'nav.table': 'Table',
  'nav.map': 'Map',
  'nav.timeline': 'Timeline',
  'nav.relations': 'Relations',
  'nav.tools': 'Tools',
  'nav.categories': 'Custom categories',
  'nav.newCategory': 'New category',
  'nav.album': 'Album',
  'nav.exportCenter': 'Export center',
  'nav.trash': 'Trash',
  'nav.settings': 'Settings',

  'mobile.openDrawer': 'Open sidebar',
  'mobile.closeDrawer': 'Close sidebar',
  'mobile.search': 'Search',
  'mobile.directory': 'Contents',
  'mobile.drawerNav': 'Sidebar navigation',
  'tabs.gallery': 'Codex',
  'tabs.wiki': 'World',
  'tabs.timeline': 'Timeline',
  'tabs.relations': 'Relations',
  'tabs.album': 'Album',

  'settings.title': 'Settings',
  'settings.tab.world': 'World',
  'settings.tab.general': 'Appearance',
  'settings.tab.plugins': 'Plugins',
  'settings.tab.data': 'Data',
  'settings.tab.about': 'About',
  'settings.close': 'Close',
  'settings.theme': 'Display mode',
  'settings.themePreset': 'Theme preset',
  'settings.relations': 'Relations behavior',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.auto': 'System',
  'settings.editorLayout': 'Editor layout',
  'settings.drawerMode': 'Mobile sidebar',
  'settings.drawerMode.overlay': 'Overlay',
  'settings.drawerMode.push': 'Push',
  'settings.drawerMode.hint': 'Overlay: the sidebar covers the content; Push: the content slides right',
  'settings.hideStatusBar': 'Hide status bar',
  'settings.hideStatusBar.hint': 'Immersive; swipe down from the top edge to peek',
  'settings.hideStatusBar.mobileOnly': 'Mobile only',
  'settings.windowBlur': 'Window blur',
  'settings.autoStart': 'Launch at login',
  'settings.wip': 'In progress',
  'settings.language': 'Language / 语言',
  'settings.language.hint': 'Takes effect immediately',

  'about.version': 'Version',
  'about.checkUpdate': 'Check for updates',
  'about.checking': 'Checking…',
  'about.repo': 'Open GitHub project',
  'about.privacy': 'Privacy',
  'about.credits': 'Open-source licenses',
  'about.portNote':
    'This is a mobile port of OC Studio. It is completely free — no paid features, no commercial use.',
  'about.portNoteSub': 'The original project is open source (MIT) by Pokanshuu; this build only repackages it for Android.',
  'about.noMaintenance':
    'This project is a porting reference only and will not be updated. Fork it if you need changes.',
  'about.noMaintenanceSub':
    'Upstream OC Studio is still active — for features and fixes, follow upstream.',

  'onboarding.title': 'Choose your language',
  'onboarding.subtitle': '选择界面语言',
  'onboarding.desc':
    'Only the interface language changes — your content stays untouched. You can switch anytime in Settings › Appearance.',
  'onboarding.continue': 'Continue',


  'option.light': 'Light',
  'option.dark': 'Dark',
  'option.auto': 'System',
  'option.multi': 'Multi-column',
  'option.full': 'Full screen',
  'option.autoLayout': 'Auto',
  'option.overlay': 'Overlay',
  'option.push': 'Push',
  'option.leftPan': 'Left-drag pan',
  'option.rightPan': 'Right-drag pan',
  'option.orthogonal': 'Orthogonal',
  'option.curve': 'Curved',
  'option.color': 'Color',
  'option.mono': 'Mono',

  'common.close': 'Close',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'OK',
  'common.search': 'Search',
  'common.new': 'New',
  'common.delete': 'Delete',
  'common.loading': 'Loading…',
}

export const MESSAGES: Record<Locale, Dict> = {
  'zh-CN': zh,
  'en-US': en,
}

/** 板块名（同时是导航键）→ 文案 key */
export const NAV_LABEL_KEYS: Record<string, string> = {
  主页: 'nav.home',
  角色: 'nav.characters',
  事件: 'nav.events',
  国家: 'nav.countries',
  世界观: 'nav.world',
  小说: 'nav.novel',
  表格: 'nav.table',
  地图: 'nav.map',
  时间线: 'nav.timeline',
  关系图: 'nav.relations',
  相册: 'nav.album',
  图鉴: 'nav.group.gallery',
  创作: 'nav.group.create',
  视图: 'nav.group.views',
}

/** 单选/开关里的中文标签 → key（控件层统一翻译） */
export const OPTION_LABEL_KEYS: Record<string, string> = {
  白天模式: 'option.light',
  夜间模式: 'option.dark',
  跟随系统: 'option.auto',
  多栏: 'option.multi',
  全屏: 'option.full',
  自动: 'option.autoLayout',
  覆盖: 'option.overlay',
  推移: 'option.push',
  左键平移: 'option.leftPan',
  右键平移: 'option.rightPan',
  正交: 'option.orthogonal',
  曲线: 'option.curve',
  彩色: 'option.color',
  黑白: 'option.mono',
}

export const GROUP_LABEL_KEYS: Record<string, string> = {
  图鉴: 'nav.group.gallery',
  创作: 'nav.group.create',
  视图: 'nav.group.views',
  工具: 'nav.tools',
  自定义分类: 'nav.categories',
}