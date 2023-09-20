import path from 'path'
import { window, workspace,Uri } from 'vscode'
import Config from './Config'
import fg from 'fast-glob'
import Extractor from './Extractor'
import { FileExt } from '..'
import fs from 'fs'
import xlsx from 'node-xlsx';
import { randomString } from '../utils'
import TranslatePane from './TranslatePane'
export default class Global {
    static async exportAllChineseList(uri:Uri) {
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
        let chineseTextList:string[] = []
        let header = ['key', '页面path', '字符描述', '是否后续人工审查', 'fullText', '简体中文', '英语']
        let data = [
            header
        ];
        exportAllChineseStatusBar.dispose()
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
                        let key = `${FILE_NAME}.${randomString(12)}`
                        if(item.text){
                            if(!chineseTextList.includes(item.text)){
                                chineseTextList.push(item.text)
                                let en = needTrans ? await getTranslateEn(item.text) : ''
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

