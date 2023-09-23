import type { LangJSON } from './base'
import Inserter from './base'
import { window } from 'vscode'
import { writeFileSync } from 'fs'
export default class JsonInserter extends Inserter {
    async insert(langPath: string, data: any) {
        this.data = data
        const originCode = this.getCode(langPath) || '{}'
        try {
            const json = JSON.parse(originCode)
            await this.traverseJson(json)
            this.write(langPath, json)
            window.showInformationMessage('保存成功！')
        }
        catch (error) {
            // window.showWarningMessage('翻译文件代码格式有误')
        }
    }

    private async traverseJson(json: LangJSON, parentKey = '') {
        Object.keys(json).forEach((key: string) => {
            let value = json[key]
            if (Object.prototype.toString.call(value) === '[object Object]') {
                const flttenKeys = this.flttenKey(key, parentKey)
                this.traverseJson(value, flttenKeys)
            }
            else {
                const flttenKeys = this.flttenKey(key, parentKey)
                if(this.isExistKey(flttenKeys)){
                    // 替换原本重复的key的值，并且删除data中重复的key
                    json[flttenKeys] = this.data[flttenKeys]
                    Reflect.deleteProperty(this.data, flttenKeys)
                }
            }
        })
    }

    private flttenKey(key: string, parentKey: string) {
        return !parentKey ? key : `${parentKey}.${key}`
    }

    private async write(langPath: string, json: LangJSON) {
        Object.keys(this.data).forEach((key: string) => {
            json[key] = this.data[key] // 插入
        })
        const code = JSON.stringify(json, null, 4)
        writeFileSync(this.getAbsoultePath(langPath), code)
    }
}