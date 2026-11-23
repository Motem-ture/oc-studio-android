# 贡献指南

> [!NOTE]
> **本项目仅作移植参考，已停止维护** —— PR 不会被合并。需要改动请 **fork 后自行维护**；
> 若修复属于上游也存在的问题，建议直接提到 [上游仓库](https://github.com/Pokanshuu/OC-Studio)。
> 下面保留的是当时的开发约定，供 fork 者参考。

## 提交 PR 前

```bash
npm ci
npx tsc --noEmit        # 类型
npm run lint            # 可选
npm run build           # 静态导出必须过
```

动了 `android/` 或需要验证安装包时，再跑：

```bash
npx cap sync android
cd android && ./gradlew assembleRelease
```

## 提交范围

- **优先修移植引入的问题**（移动端布局、Android 适配、导出、多语言）。
- 上游业务逻辑（数据模型、编辑器、导出器）尽量少改；确实需要改时，在 PR 里写清楚
  「上游同样存在」还是「只在 Android 出现」，前者更适合直接提到上游。
- 新增界面文案：中文写在组件里（保持上游风格），英文补到 `src/lib/i18n/ui-dict-*.ts`；
  需要插值的句子用 `messages.ts` + `t()`。

## 代码风格

- 与上游一致：TypeScript 严格模式、函数组件、Tailwind v4 原子类、注释写「为什么」而不是「是什么」。
- 移动端布局统一用 `max-md:` / `md:` 前缀，不要在 JS 里判断宽度渲染不同结构（断点已经在 CSS 里）。

## 报 Bug

请附：

1. 机型 + 系统版本（例如 `ColorOS 17 / Android 16`）
2. 应用版本（设置 › 关于 › 版本，或 `versionCode`）
3. 复现步骤 + 截图 / 录屏
4. 如果是导出、分享、权限相关：`adb logcat | grep -i ocstudio` 的片段

## 许可

提交即视为同意以 [MIT](LICENSE) 许可发布你的贡献。