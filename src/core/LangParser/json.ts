import type { LangJSON } from './base'
import LangParser from './base'

export default class JsonLangParser extends LangParser {
    async findMatchKeys(langPath: string, word: string): Promise<string[]> {
        this._word = word
        this._keys = []
        const code = this.getCode(langPath) || '{}'
        try {
            const json = JSON.parse(code)
            // console.log('json=>', json)

            await this.traverseJson(json)
        }
        catch (error) {
            // window.showWarningMessage('翻译文件代码格式有误')
        }
        return this._keys
    }

    private async traverseJson(json: LangJSON, parentKey = '') {
        Object.keys(json).forEach((key: string) => {
            const value = json[key]
            if (Object.prototype.toString.call(value) === '[object Object]') {
                const flttenKeys = this.flttenKey(key, parentKey)
                this.traverseJson(value, flttenKeys)
            }
            else {
                const flttenKeys = this.flttenKey(key, parentKey)
                if (value === this._word)
                    this._keys.push(flttenKeys)
            }
        })
    }

    private flttenKey(key: string, parentKey: string) {
        return !parentKey ? key : `${parentKey}.${key}`
    }
}