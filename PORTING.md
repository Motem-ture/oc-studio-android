# 移植说明（与上游的差异）

> **仅作移植参考，不再更新。** 这份文档记录的是「当时怎么把上游搬到 Android」，
> 不承诺跟随上游后续版本。要长期维护请 fork。

上游：[Pokanshuu/OC-Studio](https://github.com/Pokanshuu/OC-Studio) v0.20.5-beta（MIT）。
本仓库 = 上游 `src/` + Android 外壳 + 移动端 UI 层。数据模型、编辑器内核、导出器尽量不动，
便于日后跟上游合并。

## 为什么是 Capacitor，而不是重写

上游是 Next.js 静态导出（`output: 'export'`）+ Tauri（WebView2）。`@capacitor/*` 依赖与
`capacitor.config.ts` 上游已备好，只是没有 `android/` 平台目录。所以这条路最省：
`npm run build` → `npx cap sync android` → 同一份 `out/` 塞进 WebView。

## 外壳与路由

| 文件 | 作用 |
|---|---|
| `android/` | Capacitor 工程。`MainActivity.java` 做了客制（见下） |
| `src/lib/env.ts` | 原生平台判定；启动脚本给 `<html>` 打 `data-mobile-shell` |
| `src/components/layout/MobileTopBar.tsx` | 手机顶栏（☰ / 目录 / 标题 / 搜索），固定 60px + safe-top |
| `src/components/layout/MobileTabBar.tsx` | 底栏五个分区 |
| `src/components/layout/MobileDrawer.tsx` | 左侧抽屉：左缘滑出、覆盖 / 推移两种模式 |
| `src/lib/mobile-nav-targets.ts` | 侧栏文案 → 移动端分区映射 |
| `src/app/page.tsx` | 各分区外层统一 `max-md:pt-[calc(60px+var(--safe-top))]` 让位 |

断点沿用上游的 `md:`（768px）：竖屏走移动外壳，横屏 / 平板自动回桌面外壳。

## 状态栏（`android/.../MainActivity.java` + `src/lib/native-bars.ts`）

- edge-to-edge，`LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`
- `WindowInsetsControllerCompat.hide(statusBars)` + `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`
- 焦点 / `onResume` / 转屏后多次重试（120 / 400 / 1000 / 2000ms），insets 变化时再隐藏一次
- `@JavascriptInterface NativeUi`：`setHideStatusBar` / `isStatusBarHidden` / `getSafeTopPx` /
  `setLightSystemBarIcons` / `shareFile`
- 少量 ROM 特判（例如小米额外加 `FLAG_TRANSLUCENT_NAVIGATION`）
- 设置项：`hideStatusBar`（默认开），可在「设置 › 个性化」关掉

## 导出（Android 10+ 分区存储）

上游移动端分支原本直接写 `Directory.Documents`（`/storage/emulated/0/Documents`），
targetSdk 30+ 必然 `EACCES`。这里改成：

1. 写进应用私有 **Cache**
2. `MainActivity.shareFile()` 用 `FileProvider` + `ACTION_SEND` 弹系统分享面板
3. JS 侧 `shareFileNatively()` 调它

涉及 `src/lib/export/download.ts`（备份 / 文本）与 `src/lib/media-download.ts`（图片 / 视频）。

## 多语言

- `src/lib/i18n/`：自研极简运行时（`I18nProvider` / `useI18n` / `t()`），无第三方库
- `messages.ts`：外壳文案（导航、设置、关于、引导）
- `ui-dict-1..6.ts`：约 2000 条「中文字面量 → 英文」，由 `DomTranslator` 在运行时替换
- `LocaleOnboarding.tsx`：首次安装（`localStorage` 无 `oc-studio-locale`）弹语言选择
- 用户内容不翻：`contenteditable` / ProseMirror / 代码块 / `data-no-i18n` 子树一律跳过

## 顺带修掉的上游问题

| 问题 | 修法 |
|---|---|
| 图鉴（CoverFlow）卡片压住抽屉 | 滚动容器 `isolation: isolate` + 居中卡清掉行内 `z-index` |
| 导出中心备份预览溢出盖住「返回」 | 窄屏预览区 `overflow-y:auto` + `justify-content: safe center`；顶栏/页签 `relative z-10` |
| 横屏下侧栏点击不切换内容 | `Sidebar.select()` 在移动端同时 `mobileNav.setSection` |
| 生产构建仍显示 `DEV · Mock` 角标 | `DevMockBadge` 在 `production` 或原生平台返回 `null` |
| 分区外层缺顶部让位导致双顶栏 | 统一 padding + 删掉页内 spacer（详见 `安卓版说明.md` 第 11 条） |
| 横屏列表页头被压成竖排 | `PAGE_TITLE` / `TOOLBAR` / `PageToolbar` 加 `whitespace-nowrap` + `overflow-x-auto` |

## 构建

见 [README](README.md#自己构建)。CI 见 [.github/workflows/build-apk.yml](.github/workflows/build-apk.yml)。

## 验证方式（重要）

本移植**没有**真机自动化回归，也没有跑到模拟器（开发机 WHPX 起不来）。实际做的是：

- `next build` + 静态服务 + 无头 Edge（puppeteer）逐页截图
- DOM 断言：顶栏高度、页面元素是否被顶栏覆盖、抽屉能否点中、导出面板按钮可点等
- APK 反查：`apksigner verify`、`aapt2 dump badging`、解包确认 dex / JS 里确实有新代码

所以 ROM 差异导致的怪问题只能靠 issue 反馈修 —— 报问题时附上机型、系统版本、复现步骤与截图。