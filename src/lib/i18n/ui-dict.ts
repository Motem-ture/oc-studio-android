/**
 * 全量界面字典（zh → en）。
 *
 * 为什么是「字面量 → 英文」而不是「key → 文案」：
 * 这个应用原本是单语中文，几千条文案散在 680 多个组件里。逐条改成 `t('key')`
 * 要动几乎每个文件，风险大、回归面也大；这里把**源码里的中文字面量本身当 key**，
 * 由 `DomTranslator` 在运行时替换已渲染出来的文字。好处是：新增文案不用改组件，
 * 补一条字典就生效；坏处是动态拼接的句子只能命中最长的那个整串。
 *
 * 词条按出现频次分成 6 批，`UI_ZH_EN` 合并成最终表；重复键后写覆盖先写。
 */
import { UI_DICT_1 } from './ui-dict-1'
import { UI_DICT_2 } from './ui-dict-2'
import { UI_DICT_3 } from './ui-dict-3'
import { UI_DICT_4 } from './ui-dict-4'
import { UI_DICT_5 } from './ui-dict-5'
import { UI_DICT_6 } from './ui-dict-6'

export const UI_ZH_EN: Record<string, string> = {
  ...UI_DICT_1,
  ...UI_DICT_2,
  ...UI_DICT_3,
  ...UI_DICT_4,
  ...UI_DICT_5,
  ...UI_DICT_6,
}

/** 运行时查询：整串 → 去空白 → 省略号写法互换（源码里 `…` 与 `...` 混用） */
export function lookupUiText(raw: string): string | null {
  if (!raw) return null
  const exact = UI_ZH_EN[raw]
  if (exact !== undefined) return exact

  const trimmed = raw.trim()
  const direct = UI_ZH_EN[trimmed]
  if (direct !== undefined) return direct

  // `搜索角色...` 与 `搜索角色…` 是同一条文案的两种写法，字典里只收了一种
  const asEllipsis = trimmed.replace(/\.\.\./g, '…')
  if (asEllipsis !== trimmed && UI_ZH_EN[asEllipsis] !== undefined) return UI_ZH_EN[asEllipsis]

  const asDots = trimmed.replace(/…/g, '...')
  if (asDots !== trimmed && UI_ZH_EN[asDots] !== undefined) return UI_ZH_EN[asDots]

  return null
}