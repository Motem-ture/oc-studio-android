import { invoke } from '@tauri-apps/api/core'
import { save as saveFileDialog } from '@tauri-apps/plugin-dialog'

import { isNativePlatform, isTauri } from '../env'
import { shareFileNatively } from '../native-bars'
import { exportToMarkdown, exportToTxt } from './markdown'
import { localDateStamp } from '../date-stamp'

/**
 * 桌面版走「系统保存对话框 + Rust 落盘」。
 *
 * 不能用 `<a download>`：WebView2 里那条路不可靠（下载被宿主接管），
 * 表现就是「点了导出没反应」——旧版本的内置库备份按钮踩过这个坑。
 * 浏览器预览（!isTauri）才走 blob 下载。
 */
async function saveWithDialog(content: string, filename: string, extensions: string[]): Promise<string | null> {
  const path = await saveFileDialog({
    defaultPath: filename,
    filters: [{ name: '导出文件', extensions }],
  })
  if (path === null) return null
  await invoke<number>('save_text', { path, content })
  return path
}

function extensionOf(filename: string): string[] {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? [] : [filename.slice(dot + 1)]
}

export async function downloadJson(data: unknown, filename?: string): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  const date = localDateStamp()
  const name = filename ?? `oc-backup-${date}.ocbak`

  if (isNativePlatform()) {
    await downloadJsonCapacitor(json, name)
    return name
  }

  if (isTauri()) {
    const saved = await saveWithDialog(json, name, extensionOf(name))
    if (saved === null) throw new Error('已取消')
    return saved
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return name
}

/**
 * Capacitor：写进**应用私有 Cache**，再交给系统分享面板。
 *
 * 旧实现直接写 `Directory.Documents`（= `/storage/emulated/0/Documents`），
 * 在 Android 10+ 的分区存储下必然 `EACCES (Permission denied)` —— 用户看到的就是
 * 「备份导出失败」。公共目录已经不是普通 App 能直接写的了，正确做法是
 * 私有目录 + `FileProvider` + `ACTION_SEND`（原生壳里实现，见 `shareFileNatively`）。
 */
async function downloadJsonCapacitor(json: string, filename: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')

  await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    recursive: true,
  })

  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })

  if (!shareFileNatively(uri, filename, 'application/json')) {
    // 老壳 / 非 Android：文件已经在 Cache 里，至少不要让用户以为「什么都没发生」
    throw new Error('当前环境不支持系统分享，请更新到最新版本')
  }
}

// ── Markdown / TXT 导出 ──


export async function downloadText(content: string, filename: string, mimeType: string): Promise<void> {
  if (isNativePlatform()) {
    await downloadTextCapacitor(content, filename)
    return
  }

  if (isTauri()) {
    const saved = await saveWithDialog(content, filename, extensionOf(filename))
    if (saved === null) throw new Error('已取消')
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function downloadTextCapacitor(content: string, filename: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')

  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    recursive: true,
  })

  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  })

  // 与 JSON 备份同一条路：私有 Cache + 系统分享面板（WebView 里 navigator.share 不可用）
  if (!shareFileNatively(uri, filename, 'text/plain')) {
    throw new Error('当前环境不支持系统分享，请更新到最新版本')
  }
}

export async function downloadMarkdown(): Promise<void> {
  const md = await exportToMarkdown()
  const date = localDateStamp()
  await downloadText(md, `oc-export-${date}.md`, 'text/markdown')
}

export async function downloadTxt(): Promise<void> {
  const txt = await exportToTxt()
  const date = localDateStamp()
  await downloadText(txt, `oc-export-${date}.txt`, 'text/plain')
}

