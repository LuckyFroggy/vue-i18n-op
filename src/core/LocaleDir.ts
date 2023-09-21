import type { WordListItem } from './../webview/src/index.d'
import path from 'path'
import { Uri, window, workspace } from 'vscode'
import Config from './Config'
import fg from 'fast-glob'
import { readFileSync } from 'fs'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import type { ObjectExpression } from '@babel/types'
import type { LangType } from '..'
import Inserter from './Inserter'
import LangParser from './LangParser'
export default class LocaleDir {
    static async set(): Promise<void> {
        const dir = await this.pickDir()
        console.log('dir=>',dir);
        
        await Config.set('localeDir', dir[0])
    }

    static async pickDir() {
        const rootPath = workspace.workspaceFolders?.[0]?.uri?.fsPath
        console.log('rootPath=>',rootPath);
        
        if (!rootPath)
            return []
        const result = await window.showOpenDialog({
            defaultUri: Uri.file(rootPath),
            canSelectFolders: true,
        })
        console.log('result=>',result);
        
        if (!result)
            return []

        return result.map(item => {
            if (process.platform === 'win32')
                return item.path.slice(1)

            return item.path
        })
            .map(pa => path.relative(rootPath, pa)
                .replace(/\\/g, '/'),
            )
    }

    static async insert(options: { wordList: WordListItem[] }) {
        const { wordList = [] } = options
        if (!this.verifyWordList(wordList))
            return

        if (!Config.localeDir)
            return this.showSetNotification()

        try {
            const langGroup: Record<LangType, any> = {
                en: {},
                zh: {},
            }
            for (const item of wordList) {
                if (!item.lang.zh)
                    break
                langGroup.en[item.key] = item.lang.en
                langGroup.zh[item.key] = item.lang.zh
            }
            const res = await Promise.all(Object.keys(langGroup).map((type) => {
                if (!Object.keys(langGroup[type as LangType]).length)
                    return Promise.resolve({})
                return Inserter.insert(type as LangType, langGroup[type as LangType])
            }))
        }
        catch (error: any) {
            error.message && window.showErrorMessage(error.message)
        }
    }

    private static verifyWordList(list: WordListItem[]) {
        if (!list || !list.length)
            return false
        for (const item of list) {
            if (!item.key) {
                window.showWarningMessage('翻译项key不能为空！')
                return false
            }
            const otherList = list.filter(oitem => oitem.id !== item.id)
            if (otherList.some(oitem => oitem.key === item.key)) {
                window.showWarningMessage(`翻译项key：【${item.key}】重复，请修改！`)
                return false
            }
        }
        return true
    }

    static async getChildrenPaths() {
        if (!Config.localeDir)
            return []
            console.log('Config.rootDir=>',Config.rootDir);
            console.log('Config.localeDir=>',Config.localeDir);
            
            
        const cwd = path.resolve(Config.rootDir, Config.localeDir)
        console.log('cwd=>',cwd);
        return await fg('**', { cwd })
    }

    static async getLangPath(lang: LangType) {
        const regExp: Record<LangType, RegExp> = {
            en: /en.(js|ts|json)/ig,
            zh: /(zh|zh-CN).(js|ts|json)/ig,
        }
        const childrenPaths = await this.getChildrenPaths()
        if (!childrenPaths || !childrenPaths.length)
            return ''
        return childrenPaths.find(item => regExp[lang].test(item)) ?? ''
    }

    static async showSetNotification() {
        const res = await window.showWarningMessage('请先设置i18n文件目录', {}, {
            title: '设置',
        })
        res && await this.set()
    }

    static async findMatchKeys(word: string): Promise<string[]> {
        if (!Config.localeDir) {
            this.showSetNotification()
            return []
        }

        const langPath = await LocaleDir.getLangPath('zh')
        if (!langPath)
            throw new Error('找不到i18n翻译配置文件！')
        return await LangParser.findMatchKeys(word)
    }
}