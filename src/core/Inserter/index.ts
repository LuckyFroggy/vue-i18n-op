import path from 'path'
import type { LangSuffix, LangType } from '../..'
import LocaleDir from '../LocaleDir'
import EcmascriptInserter from './ecmascript'
import JsonInserter from './json'
import type AbstractInserter from './base'
export default class Inserter {
    private static strategy: Record<LangSuffix, AbstractInserter> = {
        '.js': new EcmascriptInserter(),
        '.ts': new EcmascriptInserter(),
        '.json': new JsonInserter(),
    }

    static async insert(type: LangType, data: any) {
        const langPath = await LocaleDir.getLangPath(type)
        if (!langPath)
            throw new Error('找不到i18n翻译配置文件！')

        const suffix = path.extname(langPath) as LangSuffix
        return this.strategy[suffix].insert(langPath, data)
        // console.log('suffix=>', suffix)
    }
}