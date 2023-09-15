import path from 'path'
import { window, workspace,Uri } from 'vscode'
import Config from './Config'
import fg from 'fast-glob'
import Extractor from './Extractor'
import { FileExt } from '..'
import fs from 'fs'
export default class Global {
    static async getAllChineseList(uri:Uri) {
        
        
        const cwd = uri.path
        let childrenPaths = await fg('**', { cwd })
        let result:any = {
            totalChinese:0,
            chineseTextList:[],
            files:[]
        }
        for(let childPath of childrenPaths){
            let filepath = cwd + '/' + childPath
            let extname = path.extname(filepath) as any
            if(['.vue','.js','.ts'].includes(extname)){
                try {
                    let code = fs.readFileSync(filepath,'utf8')
                    const extractor = Extractor(extname)
                    const res = await extractor.extract(code, filepath)
                    if(res.pureWords.length){
                        result.files.push({
                            path:childPath,
                            chineseList:res
                        })
                        result.chineseTextList = [...new Set([...result.chineseTextList, ...res.pureWords])]
                    }
                } catch (error) {
                    console.log('error=>',error);
                }
            }
        }
        result.totalChinese = result.chineseTextList.length
        let str = `let res = ${JSON.stringify(result,null,4)}`
        let saveDialogRes = await window.showSaveDialog({
            defaultUri: Uri.file(path.join(Config.rootDir, `extracted_Chinese_text.js`)),
            filters:{
                'JavaScript':['js']
            },
        })
        if (!saveDialogRes) {
            return false
        }
        fs.writeFileSync(saveDialogRes?.fsPath, str)
    }
}
