import type { Position } from 'vscode'

export type MessageType = 'loaded' | 'translate' | 'translateAll' | 'save'
export interface Message {
    type: MessageType
    data: any
}
export type FileExt = '.vue' | '.js' | '.ts'
export type LangType = 'zh' | 'en'
export interface WordListItem {
    id: string
    key: string
    lang: {
        zh: string
        en: string
    }
}
export interface ExtractedWordItem {
    id: string
    type: string // 类型
    text: string // 提取到的包含中文的字符串
    // fullText?: string // 用于处理例如vue-template-attr类型转换后将prop="xxx"设置成:prop="$t('xxx.xxx')"
    // start: number // 开始
    // end: number
    // range: Range
    isSetup: boolean // 是否是setup

}
export type TagType = 'template' | 'script'
export type LangSuffix = '.js' | '.ts' | '.json'
