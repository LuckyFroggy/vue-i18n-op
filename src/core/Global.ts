import path from 'path'
import { window, workspace,Uri } from 'vscode'
import Config from './Config'
import fg from 'fast-glob'
import Extractor from './Extractor'
import { FileExt, WordListItem } from '..'
import fs from 'fs'
import xlsx from 'node-xlsx';
import { randomString } from '../utils'
import TranslatePane from './TranslatePane'
import LocaleDir from './LocaleDir'
import Replacer from './Replacer'
export default class Global {

    // 导出翻译模板
    static async exportToExcel(uri:Uri) {
        let needTransInfomationThen = await window.showInformationMessage('导出的同时是否进行全量翻译？（该过程耗时可能较久）','是','否')
        let needTrans = needTransInfomationThen=='是'
        let exportAllChineseStatusBar = window.setStatusBarMessage('正在分析该目录下需要提取的文件，请稍候...')
        const cwd = path.resolve(uri.fsPath) 
        let lastSrc = uri.path.split('/').pop()
        let childrenPaths = await fg('**', { cwd })
        let filterChildrenPaths = childrenPaths.filter(item=>{
            let filepath = cwd + '/' + item
            let extname = path.extname(filepath) as any
            return ['.vue','.js','.ts'].includes(extname)
        })
        exportAllChineseStatusBar.dispose()
        let chineseTextList:string[] = []
        let header = ['key', '页面path', '字符描述', '是否后续人工审查', 'fullText', '简体中文', '英语']
        let data = [
            header
        ];
        for(let index in filterChildrenPaths){
            let childPath = filterChildrenPaths[index]
            let currentExportStatusBar = window.setStatusBarMessage(`[${Number(index)+1}/${filterChildrenPaths.length}]当前正在对${lastSrc+'/'+childPath}文件进行处理，请稍候...`)
            let filepath = cwd + '/' + childPath
            const FILE_NAME = childPath.replace(/\/|\\/g, '\n').split('\n').slice(-1)[0]?.split('.')?.[0] ?? 'key'
            let extname = path.extname(filepath) as any
            try {
                let code = fs.readFileSync(filepath,'utf8')
                const extractor = Extractor(extname)
                const res = await extractor.extract(code, filepath)
                if(res.pureWords.length){
                    for(let item of res.words){
                        
                        if(item.text){
                            if(!chineseTextList.includes(item.text)){
                                chineseTextList.push(item.text)
                                let en = needTrans ? await getTranslateEn(item.text) : ''
                                let key = `${FILE_NAME}.${randomString(12)}`
                                data.push([key,lastSrc+'/'+childPath,'','否','',item.text,en])
                            }
                            continue
                        }
                        if(item.type == 'vue-template-interpolation' || item.type == 'vue-directive-text'){
                            if(item.replaceTexts && item.replaceTexts.length){
                                for(let el of item.replaceTexts){
                                    if(!chineseTextList.includes(el.text)){
                                        chineseTextList.push(el.text)
                                        let en = needTrans ? await getTranslateEn(el.text) : ''
                                        let key = `${FILE_NAME}.${randomString(12)}`
                                        data.push([key,lastSrc+'/'+childPath,'','是',item.fullText,el.text,en])
                                    }
                                }
                            }
                            continue
                        }
                    }
                }
            } catch (error) {
                console.log('error=>',error);
            }
            currentExportStatusBar.dispose()
        }
        // let str = `let res = ${JSON.stringify(result,null,4)}`
        
        var buffer = xlsx.build([{name: '所选目录下所有中文表格', data: data, options:{
            '!cols':[{wch: 10}, {wch: 30}, {wch: 30}, {wch: 10},{wch: 40},{wch: 60},{wch: 40}]
        }}]);
        let saveDialogRes = await window.showSaveDialog({
            defaultUri: Uri.file(path.join(Config.rootDir, `所选目录下所有中文表格.xlsx`)),
            filters:{
                'Excel':['xlsx']
            },
        })
        if (!saveDialogRes) {
            return false
        }
        fs.writeFileSync(saveDialogRes?.fsPath, buffer)
    }
    // 导入翻译模板
    static async importExcel() {
        let targetUris = await window.showOpenDialog({
            defaultUri: Uri.file(path.join(Config.rootDir)),
            canSelectFolders: false,
        })
        if(!targetUris?.length)return false
        // 不做判断了，默认选的文件就是xlsx格式的
        let targetUri = targetUris[0]
        let sheets = xlsx.parse(targetUri.fsPath);
        // 默认只有一个sheet，取第0项
        let data = sheets[0].data
        let wordList:WordListItem[] = []
        data.shift()
        for(let i in data){
            let item = data[i]
            wordList.push({
                id:item[0],
                key:item[0],
                lang:{
                    zh:item[5],
                    en:item[6]
                }
            })
        }
        await LocaleDir.insert({ wordList })
        window.showInformationMessage('导入成功！')
        
        
    }

    // 替换当前目录下所有中文
    static async replaceAll(uri:Uri) {
        let exportAllChineseStatusBar = window.setStatusBarMessage('正在分析该目录下需要提取的文件，请稍候...')
        const cwd = path.resolve(uri.fsPath) 
        let lastSrc = uri.path.split('/').pop()
        let childrenPaths = await fg('**', { cwd })
        
        let filterChildrenPaths = childrenPaths.filter(item=>{
            let filepath = cwd + '/' + item
            let extname = path.extname(filepath) as any
            return ['.vue','.js','.ts'].includes(extname) && filepath.indexOf(Config.localeDir) == -1
        })
        
        exportAllChineseStatusBar.dispose()
        
        for(let index in filterChildrenPaths){
            let childPath = filterChildrenPaths[index]
            let filepath = cwd + '/' + childPath
            let extname = path.extname(filepath) as any
            try {
                let text = fs.readFileSync(filepath,'utf8')
                const extractor = Extractor(extname)
                const wordsData = await extractor.extract(text, filepath)
                let replaceRes = await Replacer.replaceWith(wordsData,filepath)
                if(!replaceRes){
                    continue
                }
               
                
            } catch (error) {
                console.log('error=>',error);
            }
        }
        window.showInformationMessage('替换成功')
    }
}
async function getTranslateEn(text: string) {
    try {
        let transRes = await TranslatePane.callTranslateApi(text)
        let en = ''
        const { trans_result = [] } = transRes?.data
        trans_result[0]?.dst && (en = trans_result[0]?.dst)
        return Promise.resolve(en)
    } catch (error) {
        console.log('error=>',error);
        return Promise.resolve('')
    }
}

