import type { AxiosResponse } from 'axios'
import axios from 'axios'
import type { Uri, WebviewPanel } from 'vscode'
import { SnippetString } from 'vscode'
import { Range, ViewColumn, window } from 'vscode'
import type { ExtractedWordItem, Message, MessageType, WordListItem } from '../index'
import { TRANSLATE_API } from '../utils/global'
import { getHtmlForWebview } from '../utils/webview'
import Config from './Config'
import CurrentFile from './CurrentFile'
import LocaleDir from './LocaleDir'
import CryptoJS from 'crypto-js'
export default class TranslatePane {
    static panel: WebviewPanel
    static uri: string
    static extractedWords: string[]
    static async open(uri: Uri) {
        // const range = new Range(
        //     window.activeTextEditor!.document.positionAt(329),
        //     window.activeTextEditor!.document.positionAt(340),
        // )
        // const unuseDecorationType = window.createTextEditorDecorationType({
        //     opacity: '0.6',
        // })

        // window.activeTextEditor?.setDecorations(unuseDecorationType, [{
        //     range,
        //     renderOptions: {
        //         after: {
        //             color: 'rgba(153, 153, 153, .7)',
        //             contentText: '›胡橙汁',
        //             fontWeight: 'normal',
        //             fontStyle: 'normal',
        //         },
        //     },
        // }])
        // 创建webview
        this.panel = window.createWebviewPanel(
            'translatePane', // viewType
            '🍻翻译面板💨', // 视图标题
            ViewColumn.Beside, // 显示在编辑器的哪个部位
            {
                enableScripts: true, // 启用JS，默认禁用
                retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
            },
        )
        this.panel.webview.html = getHtmlForWebview(Config.ctx.extensionPath, 'webview/index.html')
        this.panel.webview.onDidReceiveMessage((msg: Message) => {
            this.messageStrategy(msg)
        }, undefined, Config.ctx.subscriptions)
        this.uri = uri.fsPath
        const extractedWords = await CurrentFile.getExtractedWords()
        this.extractedWords = extractedWords.pureWords
    }

    static messageStrategy(msg: Message) {
        const { type, data } = msg
        let strategy: Record<MessageType, () => Promise<void> | void> | void | null = {
            loaded: () => this.loaded(),
            translate: () => this.translate(data),
            translateAll: () => this.translateAll(data),
            save: () => this.save(data),
        }
        strategy[type]()
        strategy = null
    }

    static async loaded() {
        this.postMessage('init', {
            uri: this.uri,
            extractedWords: this.extractedWords,
        })
    }

    /**
     * 由于google翻译api因为政策原因停止服务，所以此方法暂时弃用
    static async translate(data: WordListItem) {
        this.callTranslateApi(data.lang.zh).then(res => {
            const { sentences = [] } = res?.data
            let str = ''
            sentences.forEach((item: { trans: string }) => {
                str += item.trans
            })
            data.lang.en = str
            this.postMessage('translate', data)
        })
    }

    static async translateAll(data: { wordList: WordListItem[] }) {
        const { wordList } = data
        const APIs: Promise<AxiosResponse<any, any>>[] = []
        wordList.forEach((item: WordListItem) => {
            APIs.push(this.callTranslateApi(item.lang.zh))
        })
        Promise.allSettled && Promise.allSettled(APIs).then(res => {
            res.forEach((item, index) => {
                if (item.status === 'fulfilled') {
                    const { sentences = [] } = item?.value?.data
                    let str = ''
                    sentences.forEach((item: { trans: string }) => {
                        str += item.trans
                    })
                    wordList[index].lang.en = str
                }
            })
            this.postMessage('translateAll', { wordList })
        })
    }
    static async callTranslateApi(text: string): Promise<AxiosResponse<any, any>> {
        return axios.get(`${TRANSLATE_API}${encodeURI(text)}`)
    }
    */

    static save(data: { wordList: WordListItem[] }) {
        const { wordList = [] } = data
        LocaleDir.insert({ wordList })
    }

    static async translate(data: WordListItem) {
        this.callTranslateApi(data.lang.zh).then(res => {
            const { trans_result = [] } = res?.data
            trans_result[0]?.dst && (data.lang.en = trans_result[0]?.dst)
            this.postMessage('translate', data)
        })
    }
    static async translateAll(data: { wordList: WordListItem[] }) {
        const { wordList } = data
        const APIs: Promise<AxiosResponse<any, any>>[] = []
        wordList.forEach((item: WordListItem) => {
            APIs.push(this.callTranslateApi(item.lang.zh))
        })
        Promise.allSettled && Promise.allSettled(APIs).then(res => {
            res.forEach((item, index) => {
                if (item.status === 'fulfilled') {
                    const { trans_result = [] } = item?.value?.data
                    trans_result[0]?.dst && (wordList[index].lang.en = trans_result[0]?.dst)
                }
            })
            this.postMessage('translateAll', { wordList })
        })
    }
    static async callTranslateApi(text: string): Promise<AxiosResponse<any, any>> {
        const appid = "20230225001576249"
        const key = "EpkaC8slQM3AhDZwxWtw"
        const salt = (new Date).getTime()
        const from = "zh"
        const to = "en"
        const str1 = appid + text + salt + key;
        const sign = CryptoJS.MD5(str1).toString();
        const params = {
            q: text,
            appid,
            salt,
            from,
            to,
            sign,
            dict:true
        }
        return axios({
            method:'get',
            url:'https://fanyi-api.baidu.com/api/trans/vip/translate',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params
        })
    }
    

    static postMessage(type: any, data = {}) {
        this.panel.webview.postMessage({
            type,
            data,
        })
    }
}