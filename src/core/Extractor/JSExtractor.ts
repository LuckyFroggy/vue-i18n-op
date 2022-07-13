import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { readFileSync } from 'fs'
import { regExpExistChinese } from '../../utils'
import CurrentFile from '../CurrentFile'
import Extractor from './base'

export default class JSExtractor extends Extractor {
    async extract() {
        this.result = {
            pureWords: [],
            words: [],
        }
        const code = CurrentFile.text
        const ast = parse(code, {
            sourceType: 'unambiguous',
            plugins: [
                'typescript',
                'decorators-legacy',
            ],
        })
        console.log('ast===>', ast)

        traverse(ast, {
            StringLiteral: (path) => {
                const { value, start, end, extra } = path.node
                if (path.findParent(p => p.isImportDeclaration()))
                    return
                if (!start || !end || !extra)
                    return
                const params = {
                    type: 'script-string',
                    offset: {
                        start,
                        end,
                    },
                    text: value,
                    source: extra.raw,
                }
                if (this.isExistChinese(value)) {
                    this.result.words.push(params)
                    !this.result.pureWords.includes(value) && this.result.pureWords.push(value)
                }
            },
            TemplateElement: (path) => {
                console.log('TemplateElement-path=>', path)
                const { value, start, end } = path.node
                if (path.findParent(p => p.isImportDeclaration()))
                    return
                if (!start || !end)
                    return
                const params = {
                    type: 'script-template',
                    offset: {
                        start,
                        end,
                    },
                    text: value.raw,
                    source: value.raw,
                }
                if (this.isExistChinese(value.raw)) {
                    this.result.words.push(params)
                    !this.result.pureWords.includes(value) && this.result.pureWords.push(value.raw)
                }
            },
        })
        console.log('this.result=>', this.result)
        this.result.pureWords = [...new Set(this.result.pureWords)]
        return this.result
    }
}