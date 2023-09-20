import { isExportDefaultDeclaration, isIdentifier, isObjectExpression, isObjectMethod } from '@babel/types'
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
} from '@vue/compiler-core'
import type { TagType } from '../..'
import type { ExtractorWordObject } from './base'
import Extractor from './base'
import _ from 'lodash'
import { window } from 'vscode'
// export declare const enum NodeTypes {
//     ROOT = 0,
//     ELEMENT = 1,
//     TEXT = 2,
//     COMMENT = 3,
//     SIMPLE_EXPRESSION = 4,
//     INTERPOLATION = 5,
//     ATTRIBUTE = 6,
//     DIRECTIVE = 7,
//     COMPOUND_EXPRESSION = 8,
//     IF = 9,
//     IF_BRANCH = 10,
//     FOR = 11,
//     TEXT_CALL = 12,
//     VNODE_CALL = 13,
//     JS_CALL_EXPRESSION = 14,
//     JS_OBJECT_EXPRESSION = 15,
//     JS_PROPERTY = 16,
//     JS_ARRAY_EXPRESSION = 17,
//     JS_FUNCTION_EXPRESSION = 18,
//     JS_CONDITIONAL_EXPRESSION = 19,
//     JS_CACHE_EXPRESSION = 20,
//     JS_BLOCK_STATEMENT = 21,
//     JS_TEMPLATE_LITERAL = 22,
//     JS_IF_STATEMENT = 23,
//     JS_ASSIGNMENT_EXPRESSION = 24,
//     JS_SEQUENCE_EXPRESSION = 25,
//     JS_RETURN_STATEMENT = 26
// }

export default class VueExtractor extends Extractor {
    private tagGroup!: Record<TagType, ElementNode[]>

    async extract(text=CurrentFile.text,filepath=CurrentFile.fsPath) {
        try {
            this.result = {
                pureWords: [],
                words: [],
            }
            this.tagGroup = {
                template: [],
                script: [],
            }
            // const text = CurrentFile.text
            const ast = this.parse(text,filepath)
            for (const node of ast.children) {
                if (node.type !== NodeTypes.ELEMENT)
                    continue
                this.insertTagGroup(node)
            }
            for (const node of this.tagGroup.template)
                await this.traverseTemplate(node)

            for (const node of this.tagGroup.script)
                await this.traverseScript(node)
        }
        catch (error) {
            console.log('error=>', error)
        }
        this.result.pureWords = [...new Set(this.result.pureWords)]
        // this.traverse(ast)
        return this.result
    }

    private parse(text: string,filepath:any) {
        return baseParse(text, {
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

    private async traverseTemplate(node: ElementNode) {
        const { children, props } = node
        await this.visitorTemplateProps(props)
        for (const cnode of children) {
            const { loc } = cnode
            if (cnode.type === NodeTypes.ELEMENT)
                await this.traverseTemplate(cnode)
            if (cnode.type === NodeTypes.TEXT) {
                const params: ExtractorWordObject = {
                    type: 'vue-template-text',
                    offset: {
                        start: loc.start.offset,
                        end: loc.end.offset,
                    },
                    text: cnode.content.trim(),
                    source: loc.source,
                    // texts: [prop.value?.content],
                    // source: prop.value?.loc.source,

                }
                if (this.isExistChinese(cnode.content)) {
                    this.result.words.push(params)
                    !this.result.pureWords.includes(cnode.content.trim()) && this.result.pureWords.push(cnode.content.trim())
                }
            }
            if (cnode.type === NodeTypes.INTERPOLATION) {
                // INTERPOLATION
                if (cnode.content.type === NodeTypes.SIMPLE_EXPRESSION) {
                    const params: ExtractorWordObject = {
                        type: 'vue-template-interpolation',
                        fullText: loc.source,
                        offset: {
                            start: loc.start.offset,
                            end: loc.end.offset,
                        },
                        replaceTexts: [],
                    }
                    const { content = '' } = cnode.content
                    const quotesChars = content.match(/('[^']*'|"[^"]*")/gm) ?? []

                    quotesChars.forEach((qchar: string) => {
                        const char = qchar.substring(1, qchar.length - 1)
                        if (this.isExistChinese(char)) {
                            params.replaceTexts.push({
                                type: 'string',
                                source: qchar,
                                text: char,
                            })
                            !this.result.pureWords.includes(char) && this.result.pureWords.push(char)
                        }
                    })
                    const templateChars = content.match(/`[^`]*`/gm) ?? []
                    templateChars.forEach((qchar: string) => {
                        const chars = qchar.replace(/('[^']*'|"[^"]*")/gm, '').replace(/(\{\{|\}\})/g, '\n').replace(/`/g, '\n').replace(/\$\{(.*)*\}/g, '\n').split('\n') ?? []
                        chars.forEach(char => {
                            if (this.isExistChinese(char)) {
                                params.replaceTexts.push({
                                    type: 'template',
                                    source: char,
                                    text: char,
                                })
                                !this.result.pureWords.includes(char) && this.result.pureWords.push(char)
                            }
                        })
                    })
                    params.replaceTexts.length && this.result.words.push(params)
                }
            }
        }
    }

    private async traverseScript(node: ElementNode) {
        // console.log('traverseScript-node=>', node)
        let isSetup = node.props.some(prop => prop.name === 'setup') // 判断是否是setup
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
                        path.traverse({
                            ObjectExpression: (path) => {
                                // console.log('path=>', path)
                                if (isExportDefaultDeclaration(path.parent)) {
                                    const { properties } = path.node
                                    isSetup = properties.some(node => (node.type === 'ObjectMethod' && isIdentifier(node.key) && node.key.name === 'setup'))
                                }
                            },
                        })
                    },
                },
                StringLiteral: (path) => {
                    const { value, start, end, extra } = path.node
                    const isGlobal = !path.findParent((path) => path.isExportDefaultDeclaration()) // 查找是否是export default模块中，是的话加this.，否则不加
                    if (path.findParent(p => p.isImportDeclaration()))
                        return
                    if (!start || !end || !extra)
                        return
                    const params: ExtractorWordObject = {
                        type: 'vue-script-string',
                        offset: {
                            start: offset + start,
                            end: offset + end,
                        },
                        text: value,
                        source: extra.raw as string,
                        isSetup,
                        isGlobal,
                    }
                    if (this.isExistChinese(value)) {
                        this.result.words.push(params)
                        !this.result.pureWords.includes(value) && this.result.pureWords.push(value)
                    }
                },
                TemplateElement: (path) => {
                    const { value, start, end } = path.node
                    const isGlobal = !path.findParent((path) => path.isExportDefaultDeclaration()) // 查找是否是export default模块中，是的话加this.，否则不加
                    if (path.findParent(p => p.isImportDeclaration()))
                        return
                    if (!start || !end)
                        return
                    const params: ExtractorWordObject = {
                        type: 'vue-script-template',
                        offset: {
                            start: offset + start,
                            end: offset + end,
                        },
                        text: value.raw,
                        source: value.raw,
                        isSetup,
                        isGlobal,
                    }
                    if (this.isExistChinese(value.raw)) {
                        this.result.words.push(params)
                        !this.result.pureWords.includes(value.raw) && this.result.pureWords.push(value.raw)
                    }
                },
            })
        }
    }

    private async visitorTemplateProps(props: (AttributeNode | DirectiveNode)[]) {
        for (const prop of props) {
            const { type, loc } = prop

            if (type === NodeTypes.ATTRIBUTE) {
                // ATTRIBUTE
                if (prop.value?.type === NodeTypes.TEXT) {
                    const params: ExtractorWordObject = {
                        type: 'vue-attribute-text',
                        offset: {
                            start: loc.start.offset,
                            end: loc.end.offset,
                        },
                        text: prop.value?.content,
                        source: prop.value?.loc.source,
                        attrName: prop.name,
                    }
                    if (this.isExistChinese(prop.value?.content)) {
                        this.result.words.push(params)
                        !this.result.pureWords.includes(prop.value?.content) && this.result.pureWords.push(prop.value?.content)
                    }
                }
            }
            else if (type === NodeTypes.DIRECTIVE) {
                // DIRECTIVE
                if (prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
                    const { content } = prop.exp
                    const params: ExtractorWordObject = {
                        type: 'vue-directive-text',
                        fullText: loc.source,
                        offset: {
                            start: loc.start.offset,
                            end: loc.end.offset,
                        },
                        replaceTexts: [],
                    }
                    const quotesChars = content.match(/('[^']*'|"[^"]*")/gm) ?? []
                    quotesChars.forEach((qchar: string) => {
                        const char = qchar.substring(1, qchar.length - 1)
                        if (this.isExistChinese(char)) {
                            params.replaceTexts.push({
                                type: 'string',
                                source: qchar,
                                text: char,
                            })
                            !this.result.pureWords.includes(char) && this.result.pureWords.push(char)
                        }
                    })
                    const templateChars = content.match(/`[^`]*`/gm) ?? []
                    templateChars.forEach((qchar: string) => {
                        const chars = qchar.replace(/('[^']*'|"[^"]*")/gm, '').replace(/(\{\{|\}\})/g, '\n').replace(/`/g, '\n').replace(/\$\{(.*)*\}/g, '\n').split('\n') ?? []
                        chars.forEach(char => {
                            if (this.isExistChinese(char)) {
                                params.replaceTexts.push({
                                    type: 'template',
                                    source: char,
                                    text: char,
                                })
                                !this.result.pureWords.includes(char) && this.result.pureWords.push(char)
                            }
                        })
                    })
                    params.replaceTexts.length && this.result.words.push(params)
                }
            }
        }
    }
}