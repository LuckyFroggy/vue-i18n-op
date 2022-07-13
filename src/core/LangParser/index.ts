import type { LangSuffix, LangType } from '../..'
import EcmascriptLangParser from './ecmascript'
import JsonLangParser from './json'
import type AbstractLangParser from './base'
import LocaleDir from '../LocaleDir'
import path from 'path'
export default class LangParser {
    private static strategy: Record<LangSuffix, AbstractLangParser> = {
        '.js': new EcmascriptLangParser(),
        '.ts': new EcmascriptLangParser(),
        '.json': new JsonLangParser(),
    }

    static async findMatchKeys(word: string) {
        const langPath = await LocaleDir.getLangPath('zh')
        if (!langPath)
            throw new Error('找不到i18n翻译配置文件！')

        const suffix = path.extname(langPath) as LangSuffix
        return this.strategy[suffix].findMatchKeys(langPath, word)
        // console.log('suffix=>', suffix)
    }
}