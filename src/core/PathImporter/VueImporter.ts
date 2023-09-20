import { identifier, importDeclaration, importDefaultSpecifier, isImportDeclaration,isImportDefaultSpecifier, stringLiteral } from '@babel/types'
import CurrentFile from '../CurrentFile'
import { regExpExistChinese } from '../../utils'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import type {
    AttributeNode,
    DirectiveNode,
    ElementNode,
} from '@vue/compiler-core'
import {
    NodeTypes,
    baseParse,
    generate
} from '@vue/compiler-core'
import type { TagType } from '../..'
import Importer from './base'
import _ from 'lodash'
import { window } from 'vscode'
import Config from '../Config'

export default class VueImporter extends Importer {
    private tagGroup!: Record<TagType, ElementNode[]>

    async import(code=CurrentFile.text,filepath=CurrentFile.fsPath) {
        try {
            this.tagGroup = {
                template: [],
                script: [],
            }
            // const code = CurrentFile.text
            const ast = this.parse(code,filepath)
            for (const node of ast.children) {
                if (node.type !== NodeTypes.ELEMENT)
                    continue
                this.insertTagGroup(node)
            }
            for (const node of this.tagGroup.script)
                await this.traverseScript(node)
        }
        catch (error) {
            console.log('error=>', error)
        }
        // this.traverse(ast)
    }

    private parse(code: string,filepath:any) {
        return baseParse(code, {
            isVoidTag:(tag)=>{
                return tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr'
            },
            // there are no components at SFC parsing level
            isNativeTag: () => true,
            // preserve all whitespaces
            isPreTag: () => true,
            getTextMode: ({ tag, props }, parent) => {
                // all top level elements except <template> are parsed as raw text
                // containers
                if ((!parent && tag !== 'template')
                    // <template lang="xxx"> should also be treated as raw text
                    || (tag === 'template'
                        && props.some(p => p.type === 6
                            && /* ATTRIBUTE */ p.name === 'lang'
                            && p.value
                            && p.value.content
                            && p.value.content !== 'html')))
                    return 2 /* RAWTEXT */

                else
                    return 0 /* DATA */
            },
            onError: e => {
                console.log('e=>', e)
                if (e.message) {
                    const message = `文件：${filepath}，${ e.message}${e.loc?.start?.line ? ` at line:${ e.loc?.start?.line}` : ''}`
                    message && window.showErrorMessage(message)
                }
            },
        })
    }

    private insertTagGroup(node: ElementNode) {
        if (!_.has(this.tagGroup, node.tag))
            return false
        const tag = node.tag as TagType
        this.tagGroup[tag].push(node)
    }

    private async traverseScript(node: ElementNode) {
        for (const item of node.children) {
            const { source, start: { offset } } = item.loc
            const ast = parse(source, {
                sourceType: 'unambiguous',
                plugins: [
                    'typescript',
                    'decorators-legacy',
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
            // const { code } = generate(ast)
        }
    }

}