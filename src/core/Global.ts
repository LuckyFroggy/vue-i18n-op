import path from 'path'
import { window, workspace,Uri } from 'vscode'
import Config from './Config'
import fg from 'fast-glob'
import Extractor from './Extractor'
import { FileExt } from '..'
import fs from 'fs'
import xlsx from 'node-xlsx';
import { randomString } from '../utils'
import { VueTemplateInterpolation } from './Extractor/base'
export default class Global {
    static async exportAllChineseList(uri:Uri) {
        let lastSrc = uri.fsPath.split('/').pop()
        const cwd = path.resolve(uri.fsPath) 
        let childrenPaths = await fg('**', { cwd })
        let chineseTextList:string[] = []
        let data = [
            ['key', '页面path', '字符描述', '是否人工审查', 'fullText', '简体中文', '英语']
        ];
        for(let childPath of childrenPaths){
            let filepath = cwd + '/' + childPath
            const FILE_NAME = childPath.replace(/\/|\\/g, '\n').split('\n').slice(-1)[0]?.split('.')?.[0] ?? 'key'
            let extname = path.extname(filepath) as any
            if(['.vue','.js','.ts'].includes(extname)){
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
                                    data.push([key,lastSrc+'/'+childPath,'','否','',item.text,''])
                                }
                                
                                continue
                            }
                            if(item.type == 'vue-template-interpolation' || item.type == 'vue-directive-text'){
                                if(item.replaceTexts && item.replaceTexts.length){
                                    for(let el of item.replaceTexts){
                                        if(!chineseTextList.includes(el.text)){
                                            chineseTextList.push(el.text)
                                            data.push([key,lastSrc+'/'+childPath,'','是',item.fullText,el.text,''])
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
            }
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
