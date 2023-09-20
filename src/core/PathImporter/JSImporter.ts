import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { readFileSync, writeFileSync } from 'fs'
import { regExpExistChinese } from '../../utils'
import CurrentFile from '../CurrentFile'
import Importer from './base'
import {identifier,importDeclaration,importDefaultSpecifier,isImportDeclaration, isImportDefaultSpecifier, stringLiteral } from '@babel/types'
import Config from '../Config'
import generate from '@babel/generator'
import path from 'path'
export default class JSImporter extends Importer {
    async import(text=CurrentFile.text,filepath=CurrentFile.fsPath) {
        // const text = CurrentFile.text
        const ast = parse(text, {
            sourceType: 'unambiguous',
            plugins: [
                'typescript',
                'decorators-legacy'
            ],
        })

        traverse(ast, {
            Program: {
                enter: (path) => {
                    let hasI18nPath = path.node.body.some(item=>{
                        console.log(item)
                        return isImportDeclaration(item) 
                            && item.specifiers.length == 1 
                            && isImportDefaultSpecifier(item.specifiers[0]) 
                            && item.specifiers[0].local.name == Config.localeFunName
                    })
                    if(!hasI18nPath){
                        let i18nImportDefaultSpecifiers = importDefaultSpecifier(identifier(Config.localeFunName))
                        let i18nStringLiteral = stringLiteral(Config.relativeI18nPath)
                        let i18nImportDeclaration = importDeclaration([i18nImportDefaultSpecifiers],i18nStringLiteral)
                        path.node.body.unshift(i18nImportDeclaration)
                    }
                },
            },
        })
        const { code } = generate(ast)
        console.log('code=>',code);
        
        let fullPath = path.join(filepath)
        console.log('fullPath=>',fullPath);
        
        writeFileSync(fullPath, code)
    }
}