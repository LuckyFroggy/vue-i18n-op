import { regExpExistChinese } from '../../utils'
export interface replaceText {
    type: 'string' | 'template'
    source: string
    text: string
}

// 偏移量（替换文本的位置）
export interface Offset {
    start: number
    end: number
}

// 被提取文本的类型
export type ExtractorWordType = 'vue-template-text' | 'vue-template-interpolation' | 'vue-script-string' | 'vue-script-template' | 'vue-attribute-text' | 'vue-directive-text' | 'vue-directive-text' | 'script-string' | 'script-template'

export interface BaseExtractorWordObject {
    type: ExtractorWordType
    offset: Offset
}

export type ExtractorWordObject = VueTemplateText | VueTemplateInterpolation | VueScriptString | VueAttributeText | VueDirectiveText | ScriptString

export interface VueTemplateText extends BaseExtractorWordObject {
    type: 'vue-template-text'
    text: string
    source: string
}
export interface VueTemplateInterpolation extends BaseExtractorWordObject {
    type: 'vue-template-interpolation'
    fullText: string
    replaceTexts: replaceText[]
}

export interface VueScriptString extends BaseExtractorWordObject {
    type: 'vue-script-string' | 'vue-script-template'
    text: string
    source: string
    isSetup: boolean
    isGlobal: boolean
}

export interface VueAttributeText extends BaseExtractorWordObject {
    type: 'vue-attribute-text'
    text: string
    source: string
    attrName: string
}

export interface VueDirectiveText extends BaseExtractorWordObject {
    type: 'vue-directive-text'
    fullText: string
    replaceTexts: replaceText[]
}

export interface ScriptString extends BaseExtractorWordObject {
    type: 'script-string' | 'script-template'
    text: string
    source: string
}
export default abstract class Extractor {
    result!: {
        pureWords: string[]
        words: ExtractorWordObject[]
    }

    isExistChinese(text: string) {
        return regExpExistChinese.test(text)
    }
}