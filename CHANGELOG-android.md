# 变更记录（Android 移植版）

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号的末位是
`versionCode`（`android/app/build.gradle`）。上游自身的变更见 [CHANGELOG.md](CHANGELOG.md)。

## [0.20.5-beta+14] — 开源准备

### Added
- `LICENSE`（保留上游 MIT 声明 + 移植部分版权）、`NOTICE`、`OFL.txt`（内置字体）
- `PORTING.md`（与上游差异）、`CONTRIBUTING.md`、本文件
- `.github/workflows/build-apk.yml`（推 tag 或手动触发出包）
- 应用内「设置 › 关于 › 开源许可」新增「本项目」分组：上游 OC Studio（MIT）与 Noto Serif SC（OFL-1.1）

### Changed
- `README.md` 改写为移植版说明；上游原 README 保留为 `README.upstream.md`
- `.gitignore` 补 `*.keystore` / `*.jks` / `android/local.properties` / `.android/` 等

## [0.20.5-beta+13] — 横屏工具栏

### Fixed
- 横屏（桌面外壳）下列表页头被压成竖排：`PAGE_TITLE` / `TOOLBAR` / `FILTER_TRIGGER` /
  `PageToolbar` 加 `whitespace-nowrap`、`shrink-0`，装不下时整条横向滚动

## [0.20.5-beta+12] — 顶部栏错位

### Fixed
- 世界观 / 小说 / 地图 / 表格 / 相册：页头被固定顶栏压住（出现两个 ☰、文字透印）
  - 分区外层统一补 `max-md:pt-[calc(60px+var(--safe-top))]`，删掉页内 spacer
- 世界观空态：编辑器顶栏无内容时移动端隐藏（`EntityEditorShell.hideHeader`）

## [0.20.5-beta+11] — 导出权限

### Fixed
- 导出备份 / 文档 / 图片报 `EACCES (Permission denied)`：不再写公共 `Documents`，
  改「私有 Cache + 系统分享面板」（`MainActivity.shareFile`）

## [0.20.5-beta+10] — 全量翻译

### Added
- `ui-dict-1..6.ts`：约 2000 条界面文案英文字典
- `DomTranslator`：运行时 DOM 翻译（跳过用户内容 / 编辑器 / 代码块）

## [0.20.5-beta+9] — 导出叠层 + 多语言骨架

### Added
- `src/lib/i18n/`（`I18nProvider` / `useI18n` / `t()`）、首次安装语言选择
- 设置 › 个性化 › 语言

### Fixed
- 导出中心 › 备份：预览卡溢出盖住「返回」与页签行

## [0.20.5-beta+8] — 图鉴层级

### Fixed
- 图鉴（画廊 / CoverFlow）角色卡压住左侧抽屉：`isolation: isolate` + 清行内 `z-index`

## [0.20.5-beta+7] — 状态栏

### Added
- 真沉浸式状态栏 + ROM 适配；`--safe-top` 由原生量取写回；设置开关

## [0.20.5-beta+6] — 移动外壳

### Added
- 左侧抽屉（覆盖 / 推移，左缘滑出）、手机顶栏 / 底栏、横屏回桌面外壳
- 生产构建隐藏 `DEV · Mock` 角标

## [0.20.5-beta+1] — 首次移植

### Added
- Capacitor Android 壳（`android/`）、图标与启动图、release 签名流程
- minSdk 24 / targetSdk 36，包名 `com.ocstudio.app`