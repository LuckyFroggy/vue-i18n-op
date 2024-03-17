import type { LangJSON } from './base'
import LangParser from './base'

export default class JsonLangParser extends LangParser {
    async findLangByKey(langPath: string, key: string){
        let lang = ''
        const code = this.getCode(langPath) || '{}'
        try {
            const json = JSON.parse(code)
            let item = this.findLangItem(json, (k, v) => key == k)
            return item?.value || ''
        }
        catch (error) {
            return ''
        }

        return lang
    }

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

    private findLangItem(json: LangJSON, fn: (arg0: string, arg1: any) => any, parentKey = '') {
        for(let key in json) {
            const value = json[key]
            if (Object.prototype.toString.call(value) === '[object Object]') {
                const flttenKeys = this.flttenKey(key, parentKey)
                this.findLangItem(value, fn, flttenKeys)
            }
            else {
                const flttenKeys = this.flttenKey(key, parentKey)
                if(fn(flttenKeys, value)){
                    return {
                        key: flttenKeys,
                        value
                    }
                }
            }
        }
    }

    private flttenKey(key: string, parentKey: string) {
        return !parentKey ? key : `${parentKey}.${key}`
    }
}