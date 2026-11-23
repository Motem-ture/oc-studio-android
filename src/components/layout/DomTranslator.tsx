'use client'

/**
 * 运行时界面翻译层。
 *
 * 为什么不是「每个组件改成 t()」：这个应用原本单语中文，几千条文案散在 680+ 个
 * 组件里，逐条改要动几乎每个文件（回归面极大）。这里换一条路：**在 DOM 层替换**。
 *
 * 规则：
 * - 只翻「整串命中字典」的文本节点与少量属性（placeholder / title / aria-label / alt）；
 *   先做一次 CJK 正则预筛，纯英文节点直接跳过。
 * - 不动：脚本 / 样式 / 代码块 / 输入框 / 可编辑区（ProseMirror、contenteditable）、
 *   以及任何带 `data-no-i18n` 的子树 —— 用户的内容永远是原文。
 * - 切回中文：把最近一次的中文原文写回去，不重新渲染。
 * - 触发：初次挂载扫一遍；之后任何文本/子节点变化都 debounce 一次**全量**重扫。
 *   全量而不是只扫新增子树，是因为 React 提交与我们的扫描可能交错，漏掉一批节点
 *   就再也不会被翻译（第一版就是这么漏了「还没有角色 / 创建第一个」）。
 *   翻译是幂等的：已经英文的节点查不到词条，不会产生新的写入，循环自然停下。
 */

import { useEffect } from 'react'

import { useI18n } from '@/lib/i18n'
import { lookupUiText } from '@/lib/i18n/ui-dict'

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'])
const SKIP_SELECTOR = [
  '[contenteditable="true"]',
  '[data-no-i18n]',
  '.ProseMirror',
  '.tiptap',
  'code',
  'pre',
  'kbd',
].join(',')

const CJK = /[\u4e00-\u9fff]/

/** 文本节点：脚本 / 代码 / 输入框 / 可编辑区里的字一律不动 */
function isSkippedText(node: Node): boolean {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  if (!el) return true
  if (SKIP_TAGS.has(el.tagName)) return true
  return el.closest(SKIP_SELECTOR) !== null
}

/** 元素：只关心属性（placeholder 等）。输入框本身要翻 placeholder，所以不按标签跳过 */
function isSkippedElement(el: Element): boolean {
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return true
  return el.closest(SKIP_SELECTOR) !== null
}

/** 翻一个文本节点；成功返回写入前的原文 */
function translateTextNode(node: Text): string | null {
  const raw = node.nodeValue
  if (!raw || !CJK.test(raw)) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const hit = lookupUiText(trimmed)
  if (hit === null) return null
  const start = raw.indexOf(trimmed)
  const next = `${raw.slice(0, start)}${hit}${raw.slice(start + trimmed.length)}`
  if (next === raw) return null
  node.nodeValue = next
  return raw
}

function translateAttributes(el: Element): boolean {
  let changed = false
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr)
    if (!value || !CJK.test(value)) continue
    const hit = lookupUiText(value.trim())
    if (hit === null || hit === value) continue
    el.setAttribute(attr, hit)
    changed = true
  }
  return changed
}

export function DomTranslator() {
  const { locale } = useI18n()
  const enabled = locale === 'en-US'

  useEffect(() => {
    if (typeof document === 'undefined') return

    /** 节点 → 最近一次的中文原文（切回中文时写回） */
    const originals = new Map<Text, string>()
    let applying = false
    let pendingWhileApplying = false
    let observer: MutationObserver | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    const remember = (node: Text, value: string) => {
      if (originals.size > 20000) originals.clear()
      originals.set(node, value)
    }

    const scan = () => {
      applying = true
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
        let current: Node | null = walker.currentNode
        while (current) {
          if (current.nodeType === Node.TEXT_NODE) {
            const text = current as Text
            if (!isSkippedText(text)) {
              const before = translateTextNode(text)
              if (before !== null) remember(text, before)
            }
          } else if (current.nodeType === Node.ELEMENT_NODE) {
            const el = current as Element
            if (!isSkippedElement(el)) translateAttributes(el)
          }
          current = walker.nextNode()
        }
      } finally {
        applying = false
      }
      if (pendingWhileApplying) {
        pendingWhileApplying = false
        schedule()
      }
    }

    const schedule = () => {
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        scan()
      }, 80)
    }

    const restore = () => {
      for (const [node, value] of originals) {
        if (node.isConnected) node.nodeValue = value
      }
      originals.clear()
    }

    if (!enabled) return

    scan()

    observer = new MutationObserver(() => {
      if (applying) {
        // 扫描期间 React 又提交了一批：等扫完再补一次，否则这批节点会被永久漏掉
        pendingWhileApplying = true
        return
      }
      schedule()
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

    return () => {
      observer?.disconnect()
      if (timer) clearTimeout(timer)
      applying = true
      restore()
      applying = false
    }
  }, [enabled])

  return null
}