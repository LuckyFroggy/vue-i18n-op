import _ from 'lodash'
import { Range, Uri, WorkspaceEdit, window, workspace } from 'vscode'
import Config from '../Config'
import CurrentFile from '../CurrentFile'
import LocaleDir from '../LocaleDir'
import { ExtractorWordObject } from '../Extractor/base'
import path from 'path'
export interface ReplaceItem {
    offset: {
        start: number
        end: number
    }
    replaceText: string
}
export default class Replacer {
    static async replaceWith(wordsData: { pureWords: string[]; words: ExtractorWordObject[] } | undefined = undefined,filepath: string | undefined = undefined) {
        // 先判断是否设置了vue/js文件的i18n翻译函数名，没有的话弹出设置
        // 获取待替换文本数组，遍历结果
        if (!Config.localeFunName)
            await this.setLocaleFunName('localeFunName')
        if (!Config.vueLocaleFunName)
            await this.setLocaleFunName('vueLocaleFunName')
        if (!Config.localeFunName || !Config.vueLocaleFunName)
            return
        const { words, pureWords } = wordsData ?? await CurrentFile.getExtractedWords()
        if (!Config.localeDir)
            await LocaleDir.showSetNotification()

        if (!pureWords.length && !filepath)
            return window.showInformationMessage('未识别到待替换文本！')

        const keyOptions = await this.getKeyOptions(pureWords,filepath)
        const replaceList: ReplaceItem[] = []
        for (const item of words) {
            const { type, offset } = item
            let replaceText = ''
            switch (type) {
                case 'script-string':
                    if (_.has(keyOptions, item.text)) {
                        replaceList.push({
                            offset,
                            replaceText: `${Config.localeFunName}('${keyOptions[item.text]}')`,
                        })
                    }
                    break
                case 'script-template':
                    if (_.has(keyOptions, item.text)) {
                        replaceList.push({
                            offset,
                            replaceText: `\$\{${Config.localeFunName}('${keyOptions[item.text]}')\}`,
                        })
                    }
                    break
                case 'vue-attribute-text':
                    if (_.has(keyOptions, item.text)) {
                        replaceList.push({
                            offset,
                            replaceText: `:${item.attrName}="${Config.vueLocaleFunName}('${keyOptions[item.text]}')"`,
                        })
                    }
                    break
                case 'vue-directive-text':
                case 'vue-template-interpolation':
                    replaceText = item.fullText
                    for (const option of item.replaceTexts) {
                        if (_.has(keyOptions, option.text)) {
                            if (option.type === 'string')
                                replaceText = replaceText.replace(option.source, `${Config.vueLocaleFunName}('${keyOptions[option.text]}')`)

                            else if (option.type === 'template')
                                replaceText = replaceText.replace(option.source, `\$\{${Config.vueLocaleFunName}('${keyOptions[option.text]}')\}`)
                        }
                    }
                    replaceList.push({
                        offset,
                        replaceText,
                    })

                    break
                case 'vue-template-text':
                    if (_.has(keyOptions, item.text)) {
                        replaceList.push({
                            offset,
                            replaceText: item.source.replace(item.text, `\{\{${Config.vueLocaleFunName}('${keyOptions[item.text]}')\}\}`),
                        })
                    }
                    break
                case 'vue-script-string':
                    if (_.has(keyOptions, item.text)) {
                        let prefix = ''
                        if (!item.isGlobal && !item.isSetup)
                            prefix = 'this.'
                        replaceList.push({
                            offset,
                            replaceText: `${prefix}${item.isGlobal ? Config.localeFunName : Config.vueLocaleFunName}('${keyOptions[item.text]}')`,
                        })
                    }
                    break
                case 'vue-script-template':
                    if (_.has(keyOptions, item.text)) {
                        let prefix = ''
                        if (!item.isGlobal && !item.isSetup)
                            prefix = 'this.'

                        replaceList.push({
                            offset,
                            replaceText: `\$\{${prefix}${item.isGlobal ? Config.localeFunName : Config.vueLocaleFunName}('${keyOptions[item.text]}')\}`,
                        })
                    }
                    break
                default:
                    break
            }
        }
        this.replace(replaceList,filepath)
    }

    private static async replace(replaceList: ReplaceItem[],filepath: string | undefined) {
        let uri = filepath ? Uri.file(filepath) : CurrentFile.getUri;
        const workspaceEdit = new WorkspaceEdit()
        for (const item of replaceList) {
            const { offset: { start, end }, replaceText } = item
            
            let res = await window.showTextDocument(uri)
            let startRange = res.document.positionAt(start)
            let endRange = res.document.positionAt(end)
            const range = new Range(
                startRange,
                endRange,
            )
            
            
            workspaceEdit.replace(uri, range, replaceText)
        }

        await workspace.applyEdit(workspaceEdit)
    }

    private static async getKeyOptions(words: string[],filepath: string | undefined) {
        const result: any = {}
        for (const word of words) {
            const keys: string[] = await LocaleDir.findMatchKeys(word)
            // filepath存在说明是多文件一起替换，这个时候默认取第0项即可
            if(filepath){
                result[word] = keys[0]
            }else{
                if (keys.length === 1)
                    result[word] = keys[0]
                if (keys.length > 1) {
                    const key = await window.showQuickPick(keys, { placeHolder: `选择一个key以替换【${word}】` })
                    key && (result[word] = key)
                }
            }
        }
        return result
    }

    static async setLocaleFunName(type: string) {
        const res = await window.showInputBox({ placeHolder: type === 'vueLocaleFunName' ? '设置vue文件的i18n插值函数名（例如$t）' : '设置i18n插值函数名（例如i18n.t）' })
        res && await Config.set(type, res)
    }
}